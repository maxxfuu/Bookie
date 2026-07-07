import { parseAccountInput } from "@/lib/account-schema"
import { firmCatalog, type FirmPlan } from "@/lib/firm-catalog"
import type { AccountInput } from "@/lib/types"

/**
 * Parser for pasted order-history tables (firm dashboard exports), e.g.:
 *
 *   Order #    Date    Products    Total    Payment    Status
 *   #6307059   Jul 5, 2026    LucidFlex 50K NT_TDV    $70.00    Credit Card    completed
 *   #6059461   Jun 29, 2026   LucidFlex Reset 50K NT_TDV    $95.00    Credit Card    completed
 *
 * Purchase rows become accounts (matched against the firm catalog for list
 * price, rules, and firm); rows whose product contains "Reset" become reset
 * events on the best-matching account.
 */

export type OrderResetDraft = { date: string; cost: number }

export type OrderAccountDraft = {
  orderId: string
  input: AccountInput
  resets: OrderResetDraft[]
}

export type OrderPasteResult = {
  drafts: OrderAccountDraft[]
  resetCount: number
  /** Human-readable notes for lines that could not be imported. */
  skipped: string[]
}

type ParsedRow = {
  orderId: string
  date: string // ISO
  product: string
  total: number
  isReset: boolean
}

const SKIP_STATUSES = new Set(["refunded", "cancelled", "canceled", "failed"])

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/\breset\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

function toISO(dateText: string): string | null {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function parseLine(line: string): ParsedRow | "header" | "skip-status" | null {
  const fields = line
    .split(/\t+|\s{3,}/)
    .map((f) => f.trim())
    .filter((f) => f !== "")
  if (fields.length < 3) return null
  if (/^order\b/i.test(fields[0]) || fields.includes("Products")) {
    return "header"
  }
  const hasId = fields[0].startsWith("#")
  const [orderId, dateText, product, ...rest] = hasId
    ? fields
    : ["", ...fields]
  const totalField = [product, ...rest].find((f) => f.includes("$"))
  const date = toISO(dateText)
  if (!date || !product || !totalField || totalField === product) return null
  const total = Number(totalField.replace(/[^0-9.]/g, ""))
  if (!Number.isFinite(total) || total < 0) return null
  const status = rest[rest.length - 1]?.toLowerCase() ?? ""
  if (SKIP_STATUSES.has(status)) return "skip-status"
  return {
    orderId,
    date,
    product,
    total,
    isReset: /\breset\b/i.test(product),
  }
}

/** Longest catalog programName contained in the product text wins. */
function matchPlan(product: string): FirmPlan | undefined {
  const norm = ` ${normalize(product)} `
  let best: FirmPlan | undefined
  for (const plan of firmCatalog) {
    const name = normalize(plan.programName)
    if (!norm.includes(` ${name} `)) continue
    if (!best || name.length > normalize(best.programName).length) {
      best = plan
    }
  }
  return best
}

/** Whatever remains of the product after the plan name — platform variant etc. */
function platformKey(product: string, plan: FirmPlan): string {
  return ` ${normalize(product)} `
    .replace(` ${normalize(plan.programName)} `, " ")
    .trim()
}

export function parseOrderPaste(text: string): OrderPasteResult {
  const skipped: string[] = []
  const rows: ParsedRow[] = []
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "") continue
    const parsed = parseLine(line)
    if (parsed === "header" || parsed === "skip-status") continue
    if (parsed === null) {
      skipped.push(`Unrecognized line: "${line.trim().slice(0, 60)}"`)
      continue
    }
    rows.push(parsed)
  }
  // Oldest first, so purchases exist before their resets.
  rows.sort((a, b) => a.date.localeCompare(b.date))

  type DraftInternal = OrderAccountDraft & { planId: string; platform: string }
  const drafts: DraftInternal[] = []
  let resetCount = 0

  for (const row of rows) {
    const plan = matchPlan(row.product)
    if (!plan) {
      skipped.push(`No catalog plan matches "${row.product}" (${row.date})`)
      continue
    }
    if (row.isReset) {
      // Attach to the matching account with the fewest resets so far; prefer
      // the same platform variant, fall back to any account on the plan.
      const platform = platformKey(row.product, plan)
      const candidates = drafts.filter(
        (d) => d.planId === plan.id && d.input.startDate <= row.date
      )
      const samePlatform = candidates.filter((d) => d.platform === platform)
      const pool = samePlatform.length > 0 ? samePlatform : candidates
      const target = [...pool].sort(
        (a, b) =>
          a.resets.length - b.resets.length ||
          a.input.startDate.localeCompare(b.input.startDate)
      )[0]
      if (!target) {
        skipped.push(
          `Reset on ${row.date} has no matching account to attach to ("${row.product}")`
        )
        continue
      }
      target.resets.push({ date: row.date, cost: row.total })
      resetCount++
      continue
    }
    const listPrice = Math.max(plan.listPrice, row.total)
    const result = parseAccountInput({
      firm: plan.firm,
      nickname: `${row.product}${row.orderId ? ` ${row.orderId}` : ""}`,
      externalId: row.orderId.replace(/^#/, ""),
      accountSize: plan.accountSize,
      programType: plan.programType,
      startDate: row.date,
      currency: "USD",
      listPrice,
      discountCode: "",
      discount: listPrice - row.total,
      refundable: plan.refundable,
      refundCondition: plan.refundCondition,
      recurringFee: plan.billing === "monthly" ? plan.listPrice : 0,
      recurringCadence: plan.billing === "monthly" ? "monthly" : "none",
      addons: [],
      rules: plan.rules,
    })
    if (!result.success) {
      skipped.push(`${row.product} (${row.date}): ${result.error}`)
      continue
    }
    drafts.push({
      orderId: row.orderId,
      input: result.data,
      resets: [],
      planId: plan.id,
      platform: platformKey(row.product, plan),
    })
  }

  return {
    drafts: drafts.map(({ orderId, input, resets }) => ({
      orderId,
      input,
      resets,
    })),
    resetCount,
    skipped,
  }
}
