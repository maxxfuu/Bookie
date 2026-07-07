import { z } from "zod"

import { TAX_CATEGORIES, type ExpenseInput } from "@/lib/types"

/** Receipts are stored inline as data URLs; keep them small. */
export const MAX_RECEIPT_BYTES = 500 * 1024

export const expenseInputSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Date must be an ISO date")
    .transform((s) => s.slice(0, 10)),
  vendor: z.string().trim().min(1, "Vendor is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  taxCategory: z.enum(TAX_CATEGORIES),
  deductiblePct: z.coerce
    .number()
    .min(0, "Deductible % must be 0–100")
    .max(100, "Deductible % must be 0–100"),
  receiptUrl: z.string().nullable(),
  businessPurpose: z
    .string()
    .trim()
    .min(1, "Business purpose is required for audit substantiation"),
})

export type ParseExpenseResult =
  | { success: true; data: ExpenseInput }
  | { success: false; error: string }

export function parseExpenseInput(raw: unknown): ParseExpenseResult {
  const result = expenseInputSchema.safeParse(raw)
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
