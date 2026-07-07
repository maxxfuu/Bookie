import type { FilingTreatment } from "@/lib/types"

/**
 * Researched treatment rules for prop-firm income, verified against the
 * cited sources (fetched July 2026). `confidence` and `uncertainNote`
 * surface in the UI instead of being buried here; where the law is unsettled
 * the conservative reading is used and flagged for CPA review.
 */
export type TreatmentInfo = {
  label: string
  /** Short plain-English description shown under the selector. */
  description: string
  /** The researched rule this bucket's math relies on. */
  rule: string
  sources: string[]
  confidence: "high" | "medium" | "low"
  uncertainNote: string
}

export const TREATMENT_INFO: Record<FilingTreatment, TreatmentInfo> = {
  business_schedule_c: {
    label: "Business (Schedule C)",
    description:
      "You trade funded accounts regularly and continuously with profit intent. Expenses net against income; self-employment tax applies.",
    rule: "Prop payouts are contractor compensation, typically reported on Form 1099-NEC. When the activity passes the IRS profit-motive test (businesslike records, regularity, time and effort), it belongs on Schedule C: ordinary and necessary expenses - eval fees, resets, data - are deductible, and net earnings owe self-employment tax of 15.3% on 92.35% of net income (Social Security portion capped at the $184,500 2026 wage base).",
    sources: [
      "https://www.irs.gov/newsroom/heres-how-to-tell-the-difference-between-a-hobby-and-a-business-for-tax-purposes",
      "https://www.irs.gov/taxtopics/tc554",
      "https://www.irs.gov/forms-pubs/about-form-1099-nec",
      "https://www.ssa.gov/news/en/cola/factsheets/2026.html",
    ],
    confidence: "high",
    uncertainNote:
      "No IRS guidance is specific to simulated-account prop payouts; the business-vs-hobby line is fact-dependent under the nine-factor test.",
  },
  hobby: {
    label: "Hobby",
    description:
      "Casual or sporadic - no profit-motive posture. Income is still taxable, but expenses are not deductible.",
    rule: "Hobby income remains fully taxable (Schedule 1, other income) with no self-employment tax, but hobby expenses are miscellaneous itemized deductions that the TCJA suspended for 2018–2025 - and the 2025 OBBBA made that elimination permanent, so they stay nondeductible for 2026 and beyond.",
    sources: [
      "https://www.irs.gov/newsroom/tips-for-taxpayers-who-make-money-from-a-hobby",
      "https://www.irs.gov/publications/p529",
      "https://www.irs.gov/newsroom/understanding-the-one-big-beautiful-bill-individual-tax-provisions-youtube-video-text-script",
    ],
    confidence: "high",
    uncertainNote: "",
  },
  trader_tax_status: {
    label: "Trader Tax Status",
    description:
      "You claim TTS for your own-account trading. Prop payouts are a different regime - simple expense-netting is not applied here.",
    rule: "TTS (IRS Topic 429) requires seeking profit from short-term price moves, substantial volume, and continuity/regularity; it unlocks Schedule C expense deductions and the optional §475(f) mark-to-market election (ordinary instead of capital treatment, no wash sales). Own-account TTS trading gains are NOT subject to self-employment tax. Prop-firm payouts, however, generally do not fit this regime - you trade the firm's capital as a contractor and receive compensation for services (1099-NEC), not capital gains, so TTS/§475 applies only to your personal account alongside it.",
    sources: [
      "https://www.irs.gov/taxtopics/tc429",
      "https://greentradertax.com/trader-tax-center/proprietary-trading/",
      "https://greentradertax.com/trader-tax-center/trader-tax-status/how-to-qualify/",
    ],
    confidence: "high",
    uncertainNote:
      "The IRS has not ruled on evaluation/funded-account payouts specifically; mark-to-market vs capital vs ordinary treatment of your combined activity is fact-dependent - have a CPA structure this.",
  },
  unsure: {
    label: "Unsure",
    description:
      "Not classified yet. Everything is tracked and estimated, but no deduction is treated as final until you pick a treatment with a CPA.",
    rule: "Conservative default: deductions are excluded from any figure presented as final until the activity is classified.",
    sources: [],
    confidence: "high",
    uncertainNote:
      "Classification of prop income is unsettled and fact-dependent - confirm with a CPA.",
  },
}

/** The ONLY bucket where write-off math runs as-is. */
export function deductionsApply(treatment: FilingTreatment): boolean {
  return treatment === "business_schedule_c"
}

/** How the deduction UI renders for each bucket. */
export type DeductionMode = "active" | "disallowed" | "pending" | "info"

export function deductionModeFor(treatment: FilingTreatment): DeductionMode {
  switch (treatment) {
    case "business_schedule_c":
      return "active"
    case "hobby":
      return "disallowed"
    case "trader_tax_status":
      return "info"
    case "unsure":
      return "pending"
  }
}

// Self-employment tax - verified against IRS Topic 554, the Schedule SE
// instructions, and SSA's 2026 COLA fact sheet ($184,500 wage base).
export const SE_NET_EARNINGS_FACTOR = 0.9235
export const SE_SS_RATE = 0.124
export const SE_MEDICARE_RATE = 0.029
export const SS_WAGE_BASE_2026 = 184500

/**
 * Estimated self-employment tax on Schedule C net income: 12.4% Social
 * Security up to the wage base + 2.9% Medicare, on 92.35% of net earnings.
 * (0.9% Additional Medicare Tax above $200k not modeled.)
 */
export function estimateSeTax(netScheduleCIncome: number): number {
  const netEarnings = Math.max(netScheduleCIncome, 0) * SE_NET_EARNINGS_FACTOR
  const socialSecurity = Math.min(netEarnings, SS_WAGE_BASE_2026) * SE_SS_RATE
  const medicare = netEarnings * SE_MEDICARE_RATE
  return socialSecurity + medicare
}
