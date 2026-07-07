import type { AccountRules, Firm, ProgramType } from "@/lib/types"

/**
 * A purchasable plan at a firm. Selecting firm → size → plan in the Add
 * modal autofills the account form from one of these entries. Prices are
 * standard (non-promo) sticker prices researched mid-2026; the discount
 * fields on the form capture promos.
 */
export type FirmPlan = {
  id: string
  firm: Firm
  programName: string
  programType: ProgramType
  accountSize: number
  /** First payment. For monthly billing this is one month. */
  listPrice: number
  billing: "monthly" | "one-time"
  /** One-time fee to activate the funded stage (0 if none). */
  activationFee: number
  /** Monthly fee once funded (data/PA), 0 if none. */
  fundedMonthlyFee: number
  /** Cost to reset a failed eval (0 if free or n/a). */
  resetFee: number
  refundable: boolean
  refundCondition: string
  rules: AccountRules
}

/** Research shape: dollar-based rule terms straight off the firms' sites. */
type RawPlan = {
  programName: string
  programType: ProgramType
  accountSize: number
  listPrice: number
  billing: "monthly" | "one-time"
  activationFee: number
  fundedMonthlyFee: number
  resetFee: number
  refundable: boolean
  refundCondition: string
  profitTargetUsd: number
  maxDrawdownUsd: number
  dailyLossLimitUsd: number
  minTradingDays: number
  hasConsistencyRule: boolean
}

const round1 = (n: number) => Math.round(n * 10) / 10

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

/** Convert researched dollar terms into the % -based AccountRules model. */
function toPlans(
  firm: Firm,
  payoutFrequencyDays: number,
  raw: RawPlan[]
): FirmPlan[] {
  return raw.map((r) => ({
    id: `${slugify(firm)}-${slugify(r.programName)}`,
    firm,
    programName: r.programName,
    programType: r.programType,
    accountSize: r.accountSize,
    listPrice: r.listPrice,
    billing: r.billing,
    activationFee: r.activationFee,
    fundedMonthlyFee: r.fundedMonthlyFee,
    resetFee: r.resetFee,
    refundable: r.refundable,
    refundCondition: r.refundCondition,
    rules: {
      profitTargetPct: round1((r.profitTargetUsd / r.accountSize) * 100),
      maxDrawdownPct: round1((r.maxDrawdownUsd / r.accountSize) * 100),
      dailyDrawdownPct: round1((r.dailyLossLimitUsd / r.accountSize) * 100),
      minTradingDays: r.minTradingDays,
      payoutFrequencyDays,
      consistencyStrictness: r.hasConsistencyRule ? 7 : 4,
    },
  }))
}

// prettier-ignore
export const firmCatalog: FirmPlan[] = [
  ...toPlans("Topstep", 7, [
    { programName: "50K Trading Combine", programType: "one-step", accountSize: 50000, listPrice: 49, billing: "monthly", activationFee: 149, fundedMonthlyFee: 0, resetFee: 49, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1000, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "100K Trading Combine", programType: "one-step", accountSize: 100000, listPrice: 99, billing: "monthly", activationFee: 149, fundedMonthlyFee: 0, resetFee: 99, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 2000, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "150K Trading Combine", programType: "one-step", accountSize: 150000, listPrice: 149, billing: "monthly", activationFee: 149, fundedMonthlyFee: 0, resetFee: 149, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 3000, minTradingDays: 2, hasConsistencyRule: true },
  ]),
  ...toPlans("Apex Trader Funding", 7, [
    { programName: "25K EOD", programType: "one-step", accountSize: 25000, listPrice: 177, billing: "one-time", activationFee: 99, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 500, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "50K EOD", programType: "one-step", accountSize: 50000, listPrice: 197, billing: "one-time", activationFee: 99, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1000, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "100K EOD", programType: "one-step", accountSize: 100000, listPrice: 297, billing: "one-time", activationFee: 99, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 1500, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "150K EOD", programType: "one-step", accountSize: 150000, listPrice: 397, billing: "one-time", activationFee: 99, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4000, dailyLossLimitUsd: 2000, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "25K Intraday", programType: "one-step", accountSize: 25000, listPrice: 118, billing: "one-time", activationFee: 79, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "50K Intraday", programType: "one-step", accountSize: 50000, listPrice: 131, billing: "one-time", activationFee: 79, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "100K Intraday", programType: "one-step", accountSize: 100000, listPrice: 198, billing: "one-time", activationFee: 79, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "150K Intraday", programType: "one-step", accountSize: 150000, listPrice: 265, billing: "one-time", activationFee: 79, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
  ]),
  ...toPlans("My Funded Futures", 5, [
    { programName: "Core 50K", programType: "one-step", accountSize: 50000, listPrice: 77, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 1500, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Rapid 25K", programType: "one-step", accountSize: 25000, listPrice: 126, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: false },
    { programName: "Rapid 50K", programType: "one-step", accountSize: 50000, listPrice: 157, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: false },
    { programName: "Rapid 100K", programType: "one-step", accountSize: 100000, listPrice: 267, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: false },
    { programName: "Rapid 150K", programType: "one-step", accountSize: 150000, listPrice: 347, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: false },
    { programName: "Pro 50K", programType: "one-step", accountSize: 50000, listPrice: 227, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Pro 100K", programType: "one-step", accountSize: 100000, listPrice: 344, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Pro 150K", programType: "one-step", accountSize: 150000, listPrice: 477, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Flex 25K", programType: "one-step", accountSize: 25000, listPrice: 153, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Flex 50K", programType: "one-step", accountSize: 50000, listPrice: 153, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "Builder 50K", programType: "one-step", accountSize: 50000, listPrice: 153, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 125, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 1, hasConsistencyRule: false },
  ]),
  ...toPlans("FundedNext", 5, [
    { programName: "Rapid 25K (Futures)", programType: "one-step", accountSize: 25000, listPrice: 99.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 91.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Rapid 50K (Futures)", programType: "one-step", accountSize: 50000, listPrice: 199.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 183.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Rapid 100K (Futures)", programType: "one-step", accountSize: 100000, listPrice: 279.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 257.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 5000, maxDrawdownUsd: 2500, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Legacy 25K (Futures)", programType: "one-step", accountSize: 25000, listPrice: 79.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 73.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 1250, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Legacy 50K (Futures)", programType: "one-step", accountSize: 50000, listPrice: 149.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 137.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Legacy 100K (Futures)", programType: "one-step", accountSize: 100000, listPrice: 249.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 229.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Bolt 50K (Futures)", programType: "one-step", accountSize: 50000, listPrice: 99.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 91.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1000, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "Flex 50K (Futures)", programType: "one-step", accountSize: 50000, listPrice: 133.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 77.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 2500, maxDrawdownUsd: 1500, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Flex 100K (Futures)", programType: "one-step", accountSize: 100000, listPrice: 249.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 144.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 5000, maxDrawdownUsd: 2500, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Flex 150K (Futures)", programType: "one-step", accountSize: 150000, listPrice: 483.99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 278.99, refundable: true, refundCondition: "Fee refunded with 3rd performance reward withdrawal", profitTargetUsd: 8000, maxDrawdownUsd: 4000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
  ]),
  ...toPlans("TradeDay", 1, [
    { programName: "$50K Quick Pay (Intraday DD)", programType: "one-step", accountSize: 50000, listPrice: 125, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 60, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$50K Quick Pay (EOD DD)", programType: "one-step", accountSize: 50000, listPrice: 175, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 85, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$100K Quick Pay (Intraday DD)", programType: "one-step", accountSize: 100000, listPrice: 230, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 110, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$100K Quick Pay (EOD DD)", programType: "one-step", accountSize: 100000, listPrice: 285, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 135, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$150K Quick Pay (Intraday DD)", programType: "one-step", accountSize: 150000, listPrice: 350, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 165, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$150K Quick Pay (EOD DD)", programType: "one-step", accountSize: 150000, listPrice: 395, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 195, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "$50K Fast Pass (EOD DD)", programType: "one-step", accountSize: 50000, listPrice: 180, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 89, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "$100K Fast Pass (EOD DD)", programType: "one-step", accountSize: 100000, listPrice: 320, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 140, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "$150K Fast Pass (EOD DD)", programType: "one-step", accountSize: 150000, listPrice: 480, billing: "monthly", activationFee: 0, fundedMonthlyFee: 0, resetFee: 225, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
  ]),
  ...toPlans("Tradeify", 5, [
    { programName: "Growth 25K", programType: "one-step", accountSize: 25000, listPrice: 99, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 60, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 600, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "Growth 50K", programType: "one-step", accountSize: 50000, listPrice: 145, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 95, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1250, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "Growth 100K", programType: "one-step", accountSize: 100000, listPrice: 255, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 169, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 2500, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "Growth 150K", programType: "one-step", accountSize: 150000, listPrice: 369, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 229, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 5000, dailyLossLimitUsd: 3750, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "Select 25K", programType: "one-step", accountSize: 25000, listPrice: 109, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 65, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "Select 50K", programType: "one-step", accountSize: 50000, listPrice: 165, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 99, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "Select 100K", programType: "one-step", accountSize: 100000, listPrice: 265, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 155, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "Select 150K", programType: "one-step", accountSize: 150000, listPrice: 369, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 215, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 3, hasConsistencyRule: true },
    { programName: "Lightning Funded 25K", programType: "instant", accountSize: 25000, listPrice: 345, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Lightning Funded 50K", programType: "instant", accountSize: 50000, listPrice: 492, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1250, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Lightning Funded 100K", programType: "instant", accountSize: 100000, listPrice: 660, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 4000, dailyLossLimitUsd: 2500, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Lightning Funded 150K", programType: "instant", accountSize: 150000, listPrice: 796, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 5250, dailyLossLimitUsd: 3000, minTradingDays: 0, hasConsistencyRule: true },
  ]),
  ...toPlans("Earn2Trade", 7, [
    { programName: "Trader Career Path 25K", programType: "one-step", accountSize: 25000, listPrice: 150, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 1750, maxDrawdownUsd: 1500, dailyLossLimitUsd: 550, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Trader Career Path 50K", programType: "one-step", accountSize: 50000, listPrice: 190, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1100, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Trader Career Path 100K", programType: "one-step", accountSize: 100000, listPrice: 350, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 2200, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Gauntlet Mini 50K", programType: "one-step", accountSize: 50000, listPrice: 170, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1100, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Gauntlet Mini 100K", programType: "one-step", accountSize: 100000, listPrice: 315, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 2200, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Gauntlet Mini 150K", programType: "one-step", accountSize: 150000, listPrice: 375, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 130, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 3300, minTradingDays: 10, hasConsistencyRule: true },
    { programName: "Gauntlet Mini 200K", programType: "one-step", accountSize: 200000, listPrice: 550, billing: "monthly", activationFee: 139, fundedMonthlyFee: 0, resetFee: 155, refundable: false, refundCondition: "", profitTargetUsd: 11000, maxDrawdownUsd: 6000, dailyLossLimitUsd: 4400, minTradingDays: 10, hasConsistencyRule: true },
  ]),
  ...toPlans("Lucid Trading", 3, [
    { programName: "LucidFlex 25K", programType: "one-step", accountSize: 25000, listPrice: 100, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 100, refundable: false, refundCondition: "", profitTargetUsd: 1250, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "LucidFlex 50K", programType: "one-step", accountSize: 50000, listPrice: 130, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 130, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "LucidFlex 100K", programType: "one-step", accountSize: 100000, listPrice: 225, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 225, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "LucidFlex 150K", programType: "one-step", accountSize: 150000, listPrice: 345, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 345, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 0, minTradingDays: 2, hasConsistencyRule: true },
    { programName: "LucidPro 25K", programType: "one-step", accountSize: 25000, listPrice: 135, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 135, refundable: false, refundCondition: "", profitTargetUsd: 1250, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "LucidPro 50K", programType: "one-step", accountSize: 50000, listPrice: 185, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 185, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1200, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "LucidPro 100K", programType: "one-step", accountSize: 100000, listPrice: 285, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 285, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3000, dailyLossLimitUsd: 1800, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "LucidPro 150K", programType: "one-step", accountSize: 150000, listPrice: 370, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 370, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 4500, dailyLossLimitUsd: 2700, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "LucidDirect 25K", programType: "instant", accountSize: 25000, listPrice: 340, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 340, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 1200, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "LucidDirect 50K", programType: "instant", accountSize: 50000, listPrice: 450, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 450, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1800, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "LucidDirect 100K", programType: "instant", accountSize: 100000, listPrice: 550, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 550, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 2400, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "LucidDirect 150K", programType: "instant", accountSize: 150000, listPrice: 849, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 849, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 5000, dailyLossLimitUsd: 3000, minTradingDays: 5, hasConsistencyRule: true },
  ]),
  ...toPlans("AquaFutures", 7, [
    { programName: "One-Step Beginner 25K", programType: "one-step", accountSize: 25000, listPrice: 125, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 39, refundable: false, refundCondition: "", profitTargetUsd: 1500, maxDrawdownUsd: 1000, dailyLossLimitUsd: 625, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "One-Step Beginner 50K", programType: "one-step", accountSize: 50000, listPrice: 200, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 55, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2500, dailyLossLimitUsd: 1250, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "One-Step Beginner 100K", programType: "one-step", accountSize: 100000, listPrice: 375, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 110, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 2500, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "One-Step Beginner 150K", programType: "one-step", accountSize: 150000, listPrice: 525, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 159, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 5000, dailyLossLimitUsd: 3750, minTradingDays: 5, hasConsistencyRule: true },
    { programName: "One-Step Standard 25K", programType: "one-step", accountSize: 25000, listPrice: 175, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 55, refundable: false, refundCondition: "", profitTargetUsd: 1250, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "One-Step Standard 50K", programType: "one-step", accountSize: 50000, listPrice: 300, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 69, refundable: false, refundCondition: "", profitTargetUsd: 3000, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "One-Step Standard 100K", programType: "one-step", accountSize: 100000, listPrice: 475, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 119, refundable: false, refundCondition: "", profitTargetUsd: 6000, maxDrawdownUsd: 3500, dailyLossLimitUsd: 0, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "One-Step Standard 150K", programType: "one-step", accountSize: 150000, listPrice: 600, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 199, refundable: false, refundCondition: "", profitTargetUsd: 9000, maxDrawdownUsd: 5000, dailyLossLimitUsd: 0, minTradingDays: 1, hasConsistencyRule: true },
    { programName: "Instant Standard 25K", programType: "instant", accountSize: 25000, listPrice: 415, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 1000, dailyLossLimitUsd: 625, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Instant Standard 50K", programType: "instant", accountSize: 50000, listPrice: 615, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 2000, dailyLossLimitUsd: 1250, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Instant Standard 100K", programType: "instant", accountSize: 100000, listPrice: 765, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 3000, dailyLossLimitUsd: 2500, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Instant Pro 25K", programType: "instant", accountSize: 25000, listPrice: 372, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 1000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Instant Pro 50K", programType: "instant", accountSize: 50000, listPrice: 572, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 2000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
    { programName: "Instant Pro 100K", programType: "instant", accountSize: 100000, listPrice: 672, billing: "one-time", activationFee: 0, fundedMonthlyFee: 0, resetFee: 0, refundable: false, refundCondition: "", profitTargetUsd: 0, maxDrawdownUsd: 3000, dailyLossLimitUsd: 0, minTradingDays: 0, hasConsistencyRule: true },
  ]),
]

export function plansForFirm(firm: Firm): FirmPlan[] {
  return firmCatalog.filter((plan) => plan.firm === firm)
}

/** Distinct account sizes a firm sells, ascending. */
export function sizesForFirm(firm: Firm): number[] {
  return [...new Set(plansForFirm(firm).map((p) => p.accountSize))].sort(
    (a, b) => a - b
  )
}

/** Plans matching a firm + size (several when a firm has multiple lines). */
export function plansFor(firm: Firm, accountSize: number): FirmPlan[] {
  return plansForFirm(firm).filter((p) => p.accountSize === accountSize)
}

export function planById(id: string): FirmPlan | undefined {
  return firmCatalog.find((p) => p.id === id)
}
