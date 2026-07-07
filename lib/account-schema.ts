import { z } from "zod"

import { getDefaultRules } from "@/lib/firms"
import { FIRM_NAMES, type AccountInput } from "@/lib/types"

/** Boolean that also accepts CSV-style strings ("true", "1", "yes"). */
const looseBoolean = z.preprocess((value) => {
  if (typeof value === "string") {
    return ["true", "1", "yes", "y"].includes(value.trim().toLowerCase())
  }
  return value
}, z.boolean())

const rulesSchema = z
  .object({
    profitTargetPct: z.coerce.number().min(0),
    maxDrawdownPct: z.coerce.number().min(0),
    dailyDrawdownPct: z.coerce.number().min(0),
    minTradingDays: z.coerce.number().min(0),
    payoutFrequencyDays: z.coerce.number().min(0),
    consistencyStrictness: z.coerce.number().min(1).max(10),
  })
  .partial()

/**
 * One validation path for both the manual form and file import: raw values
 * in, a complete `AccountInput` out.
 */
export const accountInputSchema = z
  .object({
    firm: z.enum(FIRM_NAMES),
    nickname: z.string().trim().min(1, "Nickname is required"),
    accountSize: z.coerce.number().positive("Account size must be positive"),
    programType: z.enum(["one-step", "two-step", "instant"]),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}/, "Start date must be an ISO date")
      .transform((s) => s.slice(0, 10)),
    currency: z
      .string()
      .trim()
      .default("USD")
      .transform((s) => (s === "" ? "USD" : s.toUpperCase())),
    listPrice: z.coerce.number().min(0),
    discountCode: z.coerce.string().default(""),
    discount: z.coerce.number().min(0).default(0),
    refundable: looseBoolean.default(false),
    refundCondition: z.string().default(""),
    recurringFee: z.coerce.number().min(0).default(0),
    recurringCadence: z.enum(["none", "monthly"]).optional(),
    addons: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          cost: z.coerce.number().min(0),
        })
      )
      .default([]),
    rules: rulesSchema.optional(),
  })
  .transform((p): AccountInput => {
    return {
      firm: p.firm,
      nickname: p.nickname,
      accountSize: p.accountSize,
      programType: p.programType,
      startDate: p.startDate,
      currency: p.currency,
      listPrice: p.listPrice,
      discountCode: p.discountCode,
      discount: p.discount,
      amountPaid: Math.max(p.listPrice - p.discount, 0),
      refundable: p.refundable,
      refundCondition:
        p.refundCondition || (p.refundable ? "Returned on first payout" : ""),
      recurringFee: p.recurringFee,
      recurringCadence:
        p.recurringCadence ?? (p.recurringFee > 0 ? "monthly" : "none"),
      addons: p.addons,
      rules: { ...getDefaultRules(p.firm, p.programType), ...(p.rules ?? {}) },
    }
  })

export type ParseAccountResult =
  { success: true; data: AccountInput } | { success: false; error: string }

export function parseAccountInput(raw: unknown): ParseAccountResult {
  const result = accountInputSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const issue = result.error.issues[0]
  const path = issue.path.join(".")
  return {
    success: false,
    error: path ? `${path}: ${issue.message}` : issue.message,
  }
}

/** Minimal CSV parser: header row + records, quoted fields supported. */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  const pushField = () => {
    row.push(field)
    field = ""
  }
  const pushRow = () => {
    if (row.length > 1 || row[0]?.trim() !== "") rows.push(row)
    row = []
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ",") {
      pushField()
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++
      pushField()
      pushRow()
    } else {
      field += char
    }
  }
  if (field !== "" || row.length > 0) {
    pushField()
    pushRow()
  }
  const [header, ...records] = rows
  if (!header) return []
  return records.map((record) =>
    Object.fromEntries(
      header.map((key, index) => [key.trim(), record[index]?.trim() ?? ""])
    )
  )
}

export type ImportResult = {
  accounts: AccountInput[]
  errors: string[]
}

/**
 * Parse a dropped CSV/JSON file into account inputs. JSON accepts a single
 * object or an array; CSV expects a header row of Account field names.
 */
export async function parseAccountFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  const trimmed = text.trim()
  let rawRecords: unknown[]
  if (
    file.name.toLowerCase().endsWith(".json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[")
  ) {
    try {
      const parsed = JSON.parse(trimmed)
      rawRecords = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return { accounts: [], errors: ["File is not valid JSON."] }
    }
  } else {
    rawRecords = parseCsv(text)
    if (rawRecords.length === 0) {
      return {
        accounts: [],
        errors: ["CSV has no records. Expected a header row plus data rows."],
      }
    }
  }
  const accounts: AccountInput[] = []
  const errors: string[] = []
  rawRecords.forEach((record, index) => {
    const result = parseAccountInput(record)
    if (result.success) {
      accounts.push(result.data)
    } else {
      errors.push(`Record ${index + 1}: ${result.error}`)
    }
  })
  return { accounts, errors }
}
