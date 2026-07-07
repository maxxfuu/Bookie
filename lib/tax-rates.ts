/**
 * Federal + per-location state/city income-tax rates used by the Tax tab.
 *
 * Everything here is an ESTIMATE seeded from officially published 2026
 * figures (single filer). Brackets are inflation-adjusted every year and
 * deductions/filing status are not modeled — every layer carries
 * `verifyBeforeFiling: true` and the UI must render a "verify before filing"
 * note wherever these numbers appear.
 */

export type TaxBracket = {
  /** Upper bound of the bracket in USD; null = no upper bound. */
  upTo: number | null
  /** Marginal rate as a fraction (0.22 = 22%). */
  rate: number
}

export type TaxLayerKind = "federal" | "state" | "city"

export type TaxLayer = {
  name: string
  kind: TaxLayerKind
  taxYear: number
  verifyBeforeFiling: true
  brackets: TaxBracket[]
}

export type TaxLocation = {
  id: string
  label: string
  state: string
  city?: string
  /** State/city layers stacked on top of federal. Empty = federal only. */
  layers: TaxLayer[]
  /** Honest one-liner about which layers apply here. */
  note: string
}

export const TAX_YEAR_SEEDED = 2026

export const FEDERAL_LAYER: TaxLayer = {
  name: "Federal",
  kind: "federal",
  taxYear: TAX_YEAR_SEEDED,
  verifyBeforeFiling: true,
  brackets: [
    { upTo: 12400, rate: 0.1 },
    { upTo: 50400, rate: 0.12 },
    { upTo: 105700, rate: 0.22 },
    { upTo: 201775, rate: 0.24 },
    { upTo: 256225, rate: 0.32 },
    { upTo: 640600, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
}

const CA_STATE: TaxLayer = {
  name: "California",
  kind: "state",
  taxYear: TAX_YEAR_SEEDED,
  verifyBeforeFiling: true,
  brackets: [
    { upTo: 10756, rate: 0.01 },
    { upTo: 25499, rate: 0.02 },
    { upTo: 40245, rate: 0.04 },
    { upTo: 55866, rate: 0.06 },
    { upTo: 70606, rate: 0.08 },
    { upTo: 360659, rate: 0.093 },
    { upTo: 432787, rate: 0.103 },
    { upTo: 721314, rate: 0.113 },
    { upTo: 1000000, rate: 0.123 },
    // 1% mental-health surtax over $1M → effective top marginal ~13.3%.
    { upTo: null, rate: 0.133 },
  ],
}

const NY_STATE: TaxLayer = {
  name: "New York State",
  kind: "state",
  taxYear: TAX_YEAR_SEEDED,
  verifyBeforeFiling: true,
  brackets: [
    { upTo: 8500, rate: 0.04 },
    { upTo: 11700, rate: 0.045 },
    { upTo: 13900, rate: 0.0525 },
    { upTo: 80650, rate: 0.055 },
    { upTo: 215400, rate: 0.06 },
    { upTo: 1077550, rate: 0.0685 },
    { upTo: 5000000, rate: 0.0965 },
    { upTo: 25000000, rate: 0.103 },
    { upTo: null, rate: 0.109 },
  ],
}

const NYC_CITY: TaxLayer = {
  name: "New York City",
  kind: "city",
  taxYear: TAX_YEAR_SEEDED,
  verifyBeforeFiling: true,
  brackets: [
    { upTo: 12000, rate: 0.03078 },
    { upTo: 25000, rate: 0.03762 },
    { upTo: 50000, rate: 0.03819 },
    { upTo: null, rate: 0.03876 },
  ],
}

const IL_STATE: TaxLayer = {
  name: "Illinois",
  kind: "state",
  taxYear: TAX_YEAR_SEEDED,
  verifyBeforeFiling: true,
  brackets: [{ upTo: null, rate: 0.0495 }],
}

export const TAX_LOCATIONS: TaxLocation[] = [
  {
    id: "nevada",
    label: "Nevada",
    state: "Nevada",
    layers: [],
    note: "Nevada has no state income tax — federal only.",
  },
  {
    id: "california",
    label: "California",
    state: "California",
    layers: [CA_STATE],
    note: "Progressive state income tax up to ~13.3%. No city layer.",
  },
  {
    id: "new-york",
    label: "New York City",
    state: "New York",
    city: "New York City",
    layers: [NY_STATE, NYC_CITY],
    note: "New York State tax plus NYC local income tax stack on federal.",
  },
  {
    id: "chicago",
    label: "Chicago",
    state: "Illinois",
    city: "Chicago",
    layers: [IL_STATE],
    note: "Illinois flat 4.95% state tax. Chicago levies no personal income tax on trading income.",
  },
  {
    id: "seattle",
    label: "Seattle",
    state: "Washington",
    city: "Seattle",
    layers: [],
    note: "Washington has no state income tax — federal only.",
  },
  {
    id: "miami",
    label: "Miami",
    state: "Florida",
    city: "Miami",
    layers: [],
    note: "Florida has no state income tax — federal only.",
  },
]

export function taxLocationById(id: string): TaxLocation {
  return TAX_LOCATIONS.find((l) => l.id === id) ?? TAX_LOCATIONS[0]
}

/** Tax owed across a progressive bracket schedule. */
export function taxFor(brackets: TaxBracket[], income: number): number {
  let tax = 0
  let floor = 0
  for (const bracket of brackets) {
    const ceiling = bracket.upTo ?? Infinity
    if (income <= floor) break
    tax += (Math.min(income, ceiling) - floor) * bracket.rate
    floor = ceiling
  }
  return tax
}

export function bracketIndexFor(
  brackets: TaxBracket[],
  income: number
): number {
  for (let i = 0; i < brackets.length; i++) {
    const ceiling = brackets[i].upTo ?? Infinity
    if (income <= ceiling || ceiling === Infinity) return i
  }
  return brackets.length - 1
}

export function marginalRateFor(
  brackets: TaxBracket[],
  income: number
): number {
  return brackets[bracketIndexFor(brackets, income)].rate
}

export type StackedTaxLayer = {
  name: string
  kind: TaxLayerKind
  tax: number
  marginalRate: number
}

export type StackedTax = {
  layers: StackedTaxLayer[]
  total: number
  /** Combined marginal rate across all layers at this income. */
  marginalRate: number
  /** total / income (0 when income is 0). */
  effectiveRate: number
}

/** Federal + the location's state/city layers, evaluated at one income. */
export function stackedTaxFor(
  location: TaxLocation,
  income: number
): StackedTax {
  const taxable = Math.max(income, 0)
  const layers = [FEDERAL_LAYER, ...location.layers].map((layer) => ({
    name: layer.name,
    kind: layer.kind,
    tax: taxFor(layer.brackets, taxable),
    marginalRate: marginalRateFor(layer.brackets, taxable),
  }))
  const total = layers.reduce((sum, l) => sum + l.tax, 0)
  return {
    layers,
    total,
    marginalRate: layers.reduce((sum, l) => sum + l.marginalRate, 0),
    effectiveRate: taxable === 0 ? 0 : total / taxable,
  }
}

export function formatPct(rate: number, digits = 1) {
  return `${(rate * 100).toFixed(digits)}%`
}
