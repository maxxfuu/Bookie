import type {
  Account,
  Expense,
  FeeType,
  Firm,
  Phase,
  TaxCategory,
  Transaction,
} from "@/lib/types"

/** Fee types that represent money going out (excludes inflow/lifecycle rows). */
export const SPEND_FEE_TYPES = [
  "eval",
  "reset",
  "activation",
  "addon",
  "recurring",
] as const satisfies readonly FeeType[]

export type SpendFeeType = (typeof SPEND_FEE_TYPES)[number]

const SPEND_SET = new Set<FeeType>(SPEND_FEE_TYPES)

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0)

const monthKey = (isoDate: string) => isoDate.slice(0, 7) // "YYYY-MM"

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMonth(month: string) {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    year: "2-digit",
  })
}

export function grossFees(data: Transaction[]) {
  return sum(data.map((t) => t.amountPaid))
}

export function totalPayouts(data: Transaction[]) {
  return sum(data.map((t) => t.payout))
}

/** Refunds actually received — logged as their own dated "refund" rows. */
export function totalRefundsReceived(data: Transaction[]) {
  return sum(
    data.filter((t) => t.feeType === "refund").map((t) => t.refundAmount)
  )
}

export function cumulativeNetSpend(data: Transaction[]) {
  return grossFees(data) - totalPayouts(data) - totalRefundsReceived(data)
}

/** Overall earnings: payouts + refunds minus every fee paid. Positive = profit. */
export function totalNetProfit(data: Transaction[]) {
  return -cumulativeNetSpend(data)
}

export function fundedAccountCount(data: Transaction[]) {
  return new Set(
    data.filter((t) => t.phaseReached === "funded").map((t) => t.accountId)
  ).size
}

/** Acquisition spend (eval + reset fees) per account that reached funded. */
export function costPerFundedAccount(data: Transaction[]) {
  const evalSpend = sum(
    data
      .filter((t) => t.feeType === "eval" || t.feeType === "reset")
      .map((t) => t.amountPaid)
  )
  const funded = fundedAccountCount(data)
  return funded === 0 ? 0 : evalSpend / funded
}

/** Payouts recovered per dollar of gross spend. Breakeven = 1.0. */
export function recoveryRatio(data: Transaction[]) {
  const gross = grossFees(data)
  return gross === 0 ? 0 : totalPayouts(data) / gross
}

export type CumulativePoint = {
  date: string
  spend: number
  payouts: number
}

/** Running totals of spend vs payouts, one point per transaction date. */
export function cumulativeSeries(data: Transaction[]): CumulativePoint[] {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date))
  const points: CumulativePoint[] = []
  let spend = 0
  let payouts = 0
  for (const t of sorted) {
    spend += t.amountPaid
    payouts += t.payout
    const last = points[points.length - 1]
    if (last?.date === t.date) {
      last.spend = spend
      last.payouts = payouts
    } else {
      points.push({ date: t.date, spend, payouts })
    }
  }
  return points
}

/** First date where cumulative payouts catch cumulative spend, if it happened. */
export function breakevenDate(data: Transaction[]) {
  return cumulativeSeries(data).find((p) => p.payouts >= p.spend)?.date ?? null
}

export type MonthlySpendPoint = { month: string; spend: number }

export function monthlyBurn(data: Transaction[]): MonthlySpendPoint[] {
  const byMonth = new Map<string, number>()
  for (const t of data) {
    const key = monthKey(t.date)
    byMonth.set(key, (byMonth.get(key) ?? 0) + t.amountPaid)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, spend]) => ({ month, spend }))
}

export type MonthlyNetFlowPoint = {
  month: string
  spend: number
  payouts: number
  net: number
}

/** Per-month spend vs payouts; net > 0 means the month burned cash. */
export function monthlyNetFlow(data: Transaction[]): MonthlyNetFlowPoint[] {
  const byMonth = new Map<string, { spend: number; payouts: number }>()
  for (const t of data) {
    const key = monthKey(t.date)
    const entry = byMonth.get(key) ?? { spend: 0, payouts: 0 }
    entry.spend += t.amountPaid
    entry.payouts += t.payout
    byMonth.set(key, entry)
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { spend, payouts }]) => ({
      month,
      spend,
      payouts,
      net: spend - payouts,
    }))
}

/** Recovery ratio now vs at the end of the prior month, in percentage points. */
export function recoveryTrend(data: Transaction[]) {
  const series = cumulativeSeries(data)
  const last = series[series.length - 1]
  if (!last) return { current: 0, priorMonthEnd: 0, deltaPoints: 0 }
  const currentMonth = monthKey(last.date)
  const prior = [...series]
    .reverse()
    .find((p) => monthKey(p.date) < currentMonth)
  const ratio = (p: CumulativePoint | undefined) =>
    !p || p.spend === 0 ? 0 : p.payouts / p.spend
  const current = ratio(last)
  const priorMonthEnd = ratio(prior)
  return {
    current,
    priorMonthEnd,
    deltaPoints: (current - priorMonthEnd) * 100,
  }
}

export type SpendByFeeTypePoint = { feeType: SpendFeeType; amount: number }

export function spendByFeeType(data: Transaction[]): SpendByFeeTypePoint[] {
  return SPEND_FEE_TYPES.map((feeType) => ({
    feeType,
    amount: sum(
      data.filter((t) => t.feeType === feeType).map((t) => t.amountPaid)
    ),
  })).filter((entry) => entry.amount > 0)
}

export type MonthlySpendByFeeType = { month: string } & Record<
  SpendFeeType,
  number
>

export function monthlySpendByFeeType(
  data: Transaction[]
): MonthlySpendByFeeType[] {
  const byMonth = new Map<string, MonthlySpendByFeeType>()
  for (const t of data) {
    const key = monthKey(t.date)
    let entry = byMonth.get(key)
    if (!entry) {
      entry = {
        month: key,
        eval: 0,
        reset: 0,
        activation: 0,
        addon: 0,
        recurring: 0,
      }
      byMonth.set(key, entry)
    }
    if (SPEND_SET.has(t.feeType)) {
      entry[t.feeType as SpendFeeType] += t.amountPaid
    }
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export type SpendByFirmPoint = { firm: Firm; amount: number }

export function spendByFirm(data: Transaction[]): SpendByFirmPoint[] {
  const byFirm = new Map<Firm, number>()
  for (const t of data) {
    byFirm.set(t.firm, (byFirm.get(t.firm) ?? 0) + t.amountPaid)
  }
  return [...byFirm.entries()].map(([firm, amount]) => ({ firm, amount }))
}

export type FirmStats = {
  firm: Firm
  avgEvalFee: number
  passRate: number
}

/** Per-firm average effective eval fee and eval-to-funded pass rate. */
export function firmStats(data: Transaction[]): FirmStats[] {
  const firms = [...new Set(data.map((t) => t.firm))]
  return firms.map((firm) => {
    const rows = data.filter((t) => t.firm === firm)
    const evalRows = rows.filter((t) => t.feeType === "eval")
    const attempts = new Set(rows.map((t) => t.accountId)).size
    const funded = new Set(
      rows.filter((t) => t.phaseReached === "funded").map((t) => t.accountId)
    ).size
    return {
      firm,
      avgEvalFee:
        evalRows.length === 0
          ? 0
          : sum(evalRows.map((t) => t.amountPaid)) / evalRows.length,
      passRate: attempts === 0 ? 0 : funded / attempts,
    }
  })
}

export function transactionsFor(accountId: string, data: Transaction[]) {
  return data.filter((t) => t.accountId === accountId)
}

/** Phase the account is in right now — the phase on its latest logged row. */
export function currentPhase(accountId: string, data: Transaction[]): Phase {
  const rows = transactionsFor(accountId, data)
  if (rows.length === 0) return "phase1"
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))[rows.length - 1]
    .phaseReached
}

export type AccountSummary = {
  account: Account
  phase: Phase
  spend: number
  payouts: number
  refunds: number
  /** Payouts + refunds minus fees for this account. Positive = profit. */
  netProfit: number
  transactionCount: number
}

/** Derived status per account so the Accounts table never stores it twice. */
export function accountSummaries(
  accounts: Account[],
  data: Transaction[]
): AccountSummary[] {
  return accounts.map((account) => {
    const rows = transactionsFor(account.id, data)
    const spend = grossFees(rows)
    const payouts = totalPayouts(rows)
    const refunds = totalRefundsReceived(rows)
    return {
      account,
      phase: currentPhase(account.id, data),
      spend,
      payouts,
      refunds,
      netProfit: payouts + refunds - spend,
      transactionCount: rows.length,
    }
  })
}

// --- Tax overlay ------------------------------------------------------------

export const TAX_CATEGORY_LABELS: Record<TaxCategory, string> = {
  fees_commissions: "Fees & commissions",
  software_data: "Software & data",
  education_research: "Education & research",
  equipment_hardware: "Equipment & hardware",
  home_office: "Home office",
  business_meals: "Business meals",
  professional_services: "Professional services",
  other: "Other",
}

const FEE_TYPE_PURPOSE: Partial<Record<FeeType, string>> = {
  eval: "Evaluation fee",
  reset: "Reset fee",
  activation: "Activation fee",
  addon: "Account add-on",
  recurring: "Platform / data subscription",
}

export const yearOf = (isoDate: string) => isoDate.slice(0, 4)

/**
 * One row on the Tax tab — either a deductible transaction auto-pulled from
 * Accounts data or a standalone expense. Never re-entered, always derived.
 */
export type DeductibleItem = {
  id: string
  date: string
  vendor: string
  category: TaxCategory
  amount: number
  deductiblePct: number
  /** amount × deductiblePct / 100 */
  deductibleValue: number
  receiptUrl: string | null
  source: "account" | "manual"
  businessPurpose: string
}

/** Union of deductible transactions + standalone expenses for a tax year. */
export function deductibleItems(
  transactions: Transaction[],
  expenses: Expense[],
  year: string
): DeductibleItem[] {
  const fromAccounts: DeductibleItem[] = transactions
    .filter(
      (t) =>
        t.deductible &&
        t.taxCategory !== null &&
        t.amountPaid > 0 &&
        yearOf(t.date) === year
    )
    .map((t) => ({
      id: t.id,
      date: t.date,
      vendor: t.firm,
      category: t.taxCategory as TaxCategory,
      amount: t.amountPaid,
      deductiblePct: 100,
      deductibleValue: t.amountPaid,
      receiptUrl: null,
      source: "account" as const,
      businessPurpose: FEE_TYPE_PURPOSE[t.feeType] ?? "Trading business fee",
    }))
  const standalone: DeductibleItem[] = expenses
    .filter((e) => yearOf(e.date) === year)
    .map((e) => ({
      id: e.id,
      date: e.date,
      vendor: e.vendor,
      category: e.taxCategory,
      amount: e.amount,
      deductiblePct: e.deductiblePct,
      deductibleValue: (e.amount * e.deductiblePct) / 100,
      receiptUrl: e.receiptUrl,
      source: "manual" as const,
      businessPurpose: e.businessPurpose,
    }))
  return [...fromAccounts, ...standalone].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
}

export function payoutsInYear(transactions: Transaction[], year: string) {
  return transactions
    .filter((t) => yearOf(t.date) === year)
    .reduce((sum, t) => sum + t.payout, 0)
}

/** Years that have any data, newest first, always including `currentYear`. */
export function taxYears(
  transactions: Transaction[],
  expenses: Expense[],
  currentYear: string
): string[] {
  const years = new Set<string>([currentYear])
  for (const t of transactions) years.add(yearOf(t.date))
  for (const e of expenses) years.add(yearOf(e.date))
  return [...years].sort((a, b) => b.localeCompare(a))
}

export type CategoryTotal = {
  category: TaxCategory
  total: number
}

/** Deductible dollars grouped the way a Schedule C wants them. */
export function deductibleByCategory(items: DeductibleItem[]): CategoryTotal[] {
  const byCategory = new Map<TaxCategory, number>()
  for (const item of items) {
    byCategory.set(
      item.category,
      (byCategory.get(item.category) ?? 0) + item.deductibleValue
    )
  }
  return [...byCategory.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}
