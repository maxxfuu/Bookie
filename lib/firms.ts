import { firmCatalog } from "@/lib/firm-catalog"
import type { AccountRules, Firm, ProgramType } from "@/lib/types"
import { FIRM_NAMES } from "@/lib/types"

/**
 * Firm attributes that don't live on individual transactions.
 * Used by the firm-comparison radar alongside stats derived from logged
 * transactions.
 */
export type FirmProfile = {
  firm: Firm
  /** Trader's share of profits, 0–1. */
  profitSplit: number
  /** Typical days from payout request to cash. */
  payoutSpeedDays: number
  /** Subjective rule strictness, 1 (lenient) – 10 (strict). */
  ruleStrictness: number
}

// Populated from per-firm research (mid-2026 published terms).
export const firmProfiles: FirmProfile[] = [
  { firm: "Topstep", profitSplit: 0.9, payoutSpeedDays: 2, ruleStrictness: 6 },
  {
    firm: "Apex Trader Funding",
    profitSplit: 1.0,
    payoutSpeedDays: 2,
    ruleStrictness: 7,
  },
  {
    firm: "My Funded Futures",
    profitSplit: 0.9,
    payoutSpeedDays: 1,
    ruleStrictness: 6,
  },
  {
    firm: "FundedNext",
    profitSplit: 0.8,
    payoutSpeedDays: 1,
    ruleStrictness: 6,
  },
  { firm: "TradeDay", profitSplit: 0.8, payoutSpeedDays: 1, ruleStrictness: 5 },
  { firm: "Tradeify", profitSplit: 0.9, payoutSpeedDays: 1, ruleStrictness: 6 },
  {
    firm: "Earn2Trade",
    profitSplit: 0.8,
    payoutSpeedDays: 7,
    ruleStrictness: 7,
  },
  {
    firm: "Lucid Trading",
    profitSplit: 0.9,
    payoutSpeedDays: 1,
    ruleStrictness: 6,
  },
  {
    firm: "AquaFutures",
    profitSplit: 0.9,
    payoutSpeedDays: 1,
    ruleStrictness: 7,
  },
]

export const FIRMS = FIRM_NAMES

const genericRules: AccountRules = {
  profitTargetPct: 6,
  maxDrawdownPct: 4,
  dailyDrawdownPct: 2,
  minTradingDays: 1,
  payoutFrequencyDays: 14,
  consistencyStrictness: 5,
}

/**
 * Default rules for a firm + program combo, sourced from the plan catalog
 * (first matching plan). Falls back to generic futures-eval terms.
 */
export function getDefaultRules(
  firm: Firm,
  programType: ProgramType
): AccountRules {
  const plan =
    firmCatalog.find((p) => p.firm === firm && p.programType === programType) ??
    firmCatalog.find((p) => p.firm === firm)
  if (plan) return { ...plan.rules }
  if (programType === "instant") {
    return { ...genericRules, profitTargetPct: 0, minTradingDays: 0 }
  }
  return { ...genericRules }
}
