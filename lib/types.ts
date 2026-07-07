export type Phase = "phase1" | "phase2" | "funded" | "breached"

export type ProgramType = "one-step" | "two-step" | "instant"

/** The firms the Add-account flow supports; drives every firm dropdown/enum. */
export const FIRM_NAMES = [
  "Topstep",
  "Apex Trader Funding",
  "My Funded Futures",
  "FundedNext",
  "TradeDay",
  "Tradeify",
  "Earn2Trade",
  "Lucid Trading",
  "AquaFutures",
] as const

export type Firm = (typeof FIRM_NAMES)[number]

export type BreachReason =
  "daily-drawdown" | "max-drawdown" | "consistency" | "other"

/**
 * "payout" and "refund" mark inflow-only rows; "phase-change" marks
 * zero-dollar lifecycle rows so the event log stays a single time series.
 */
export type FeeType =
  | "eval"
  | "reset"
  | "activation"
  | "addon"
  | "recurring"
  | "payout"
  | "refund"
  | "phase-change"

export type RefundStatus = "none" | "pending" | "received"

export type Transaction = {
  id: string
  date: string // ISO
  firm: Firm
  accountId: string
  feeType: FeeType
  listPrice: number
  discount: number // amount off
  amountPaid: number // effective spend
  phaseReached: Phase // account phase as of this row
  refundable: boolean
  refundStatus: RefundStatus
  refundAmount: number // meaningful on "refund" rows (and mirrored on eval rows for display)
  payout: number // inflow on this row, 0 if none
  profitSplitPct?: number // context on payout rows
  breachReason?: BreachReason // context on phase-change rows to "breached"
}

/** Rule terms that feed the radar; defaulted from lib/firms.ts, overridable per account. */
export type AccountRules = {
  profitTargetPct: number
  maxDrawdownPct: number
  dailyDrawdownPct: number
  minTradingDays: number
  payoutFrequencyDays: number
  /** 1 (lenient) – 10 (strict) */
  consistencyStrictness: number
}

export type AccountAddon = {
  name: string
  cost: number
}

export type RecurringCadence = "none" | "monthly"

/**
 * Static account fields captured in the Add modal. Everything that happens
 * after purchase (resets, phase changes, payouts, refunds, recurring accruals)
 * is a Transaction referencing `id`.
 */
export type Account = {
  id: string
  firm: Firm
  nickname: string
  accountSize: number
  programType: ProgramType
  startDate: string // ISO — anchors all time series
  currency: string
  listPrice: number
  discountCode: string
  discount: number // amount off
  amountPaid: number // effective spend on the eval fee
  refundable: boolean
  refundCondition: string
  recurringFee: number
  recurringCadence: RecurringCadence
  addons: AccountAddon[]
  rules: AccountRules
}

/** What the Add-account flow produces; the store assigns the id. */
export type AccountInput = Omit<Account, "id">

/** Events logged against an account after creation. */
export type LogEventInput =
  | { type: "reset"; date: string; cost: number }
  | {
      type: "phase-change"
      date: string
      phase: Phase
      activationFee?: number
      breachReason?: BreachReason
    }
  | { type: "payout"; date: string; amount: number; profitSplitPct?: number }
  | { type: "refund"; date: string; amount: number }
  | { type: "addon"; date: string; name: string; cost: number }
