"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { ChartTaxSensitivity } from "@/components/chart-tax-sensitivity"
import { TaxBracketCard } from "@/components/tax-bracket-card"
import { TaxExpenseTable } from "@/components/tax-expense-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  deductibleByCategory,
  deductibleItems,
  formatCurrency,
  payoutsInYear,
  taxYears,
  TAX_CATEGORY_LABELS,
  type DeductibleItem,
} from "@/lib/selectors"
import { formatPct, stackedTaxFor, taxLocationById } from "@/lib/tax-rates"
import {
  deductionModeFor,
  deductionsApply,
  estimateSeTax,
  TREATMENT_INFO,
} from "@/lib/tax-treatments"
import { useAccounts } from "@/lib/store"
import {
  FILING_TREATMENTS,
  TAX_CATEGORIES,
  type FilingTreatment,
  type TaxCategory,
} from "@/lib/types"
import { cn } from "@/lib/utils"
import { DownloadIcon, ExternalLinkIcon } from "lucide-react"

type ReceiptFilter = "all" | "has" | "missing"

const isMissingReceipt = (item: DeductibleItem) =>
  item.source === "manual" && item.receiptUrl === null

const categoryChartConfig = {
  total: {
    label: "Deductible",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function csvEscape(value: string | number) {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s
}

/** Category-grouped CSV with totals + receipt checklist — the CPA handoff. */
function buildTaxCsv(
  items: DeductibleItem[],
  year: string,
  treatment: FilingTreatment
): string {
  const lines: string[] = [
    `Bookie deductible expenses — tax year ${year}`,
    `Filing treatment: ${TREATMENT_INFO[treatment].label}${
      deductionsApply(treatment)
        ? ""
        : " (deductions NOT applied under this treatment)"
    }`,
    "",
    "Category,Date,Vendor,Amount,Deductible %,Deductible $,Receipt,Source,Business purpose",
  ]
  for (const { category, total } of deductibleByCategory(items)) {
    for (const item of items.filter((i) => i.category === category)) {
      lines.push(
        [
          TAX_CATEGORY_LABELS[category],
          item.date,
          csvEscape(item.vendor),
          item.amount.toFixed(2),
          item.deductiblePct,
          item.deductibleValue.toFixed(2),
          item.receiptUrl
            ? "attached"
            : item.source === "account"
              ? "firm statement"
              : "MISSING",
          item.source === "account" ? "auto" : "manual",
          csvEscape(item.businessPurpose),
        ].join(",")
      )
    }
    lines.push(
      `${TAX_CATEGORY_LABELS[category]} subtotal,,,,,${total.toFixed(2)},,,`
    )
  }
  const total = items.reduce((sum, i) => sum + i.deductibleValue, 0)
  lines.push(`TOTAL,,,,,${total.toFixed(2)},,,`)
  const missing = items.filter(isMissingReceipt)
  lines.push("", "Receipt checklist — still missing:")
  if (missing.length === 0) {
    lines.push("(none)")
  } else {
    for (const item of missing) {
      lines.push(
        `${item.date},${csvEscape(item.vendor)},${item.amount.toFixed(2)}`
      )
    }
  }
  return lines.join("\n")
}

export default function Page() {
  const {
    hydrated,
    transactions,
    expenses,
    taxSettings,
    taxLocationId,
    removeExpense,
    setFilingTreatment,
    setTaxLocation,
  } = useAccounts()

  const currentYear = String(new Date().getFullYear())
  const [year, setYear] = React.useState(currentYear)
  const [categories, setCategories] = React.useState<TaxCategory[]>([])
  const [receiptFilter, setReceiptFilter] = React.useState<ReceiptFilter>("all")
  const [fromDate, setFromDate] = React.useState("")
  const [toDate, setToDate] = React.useState("")

  const years = React.useMemo(
    () => taxYears(transactions, expenses, currentYear),
    [transactions, expenses, currentYear]
  )

  // Year-scoped, unfiltered — drives the bracket math.
  const yearItems = React.useMemo(
    () => deductibleItems(transactions, expenses, year),
    [transactions, expenses, year]
  )
  const totalDeductibleYear = yearItems.reduce(
    (sum, i) => sum + i.deductibleValue,
    0
  )
  const payouts = React.useMemo(
    () => payoutsInYear(transactions, year),
    [transactions, year]
  )

  // The treatment gates every deduction figure. Default: unsure.
  const treatment: FilingTreatment = taxSettings[year]?.treatment ?? "unsure"
  const treatmentInfo = TREATMENT_INFO[treatment]
  const mode = deductionModeFor(treatment)
  const applied = deductionsApply(treatment)

  const netTaxableIncome = Math.max(
    payouts - (applied ? totalDeductibleYear : 0),
    0
  )
  const seTax = applied ? estimateSeTax(netTaxableIncome) : null
  const marginalRate = stackedTaxFor(
    taxLocationById(taxLocationId),
    netTaxableIncome
  ).marginalRate

  // Filter bar applies on top of the year scope — table + KPIs + breakdown.
  const filteredItems = React.useMemo(
    () =>
      yearItems.filter((item) => {
        if (categories.length > 0 && !categories.includes(item.category)) {
          return false
        }
        if (receiptFilter === "has" && item.receiptUrl === null) return false
        if (receiptFilter === "missing" && !isMissingReceipt(item)) {
          return false
        }
        if (fromDate && item.date < fromDate) return false
        if (toDate && item.date > toDate) return false
        return true
      }),
    [yearItems, categories, receiptFilter, fromDate, toDate]
  )

  const filteredTotal = filteredItems.reduce(
    (sum, i) => sum + i.deductibleValue,
    0
  )
  const fromAccountsTotal = filteredItems
    .filter((i) => i.source === "account")
    .reduce((sum, i) => sum + i.deductibleValue, 0)
  const missingReceipts = filteredItems.filter(isMissingReceipt)
  const missingTotal = missingReceipts.reduce((sum, i) => sum + i.amount, 0)
  const attachedCount = filteredItems.filter(
    (i) => i.receiptUrl !== null
  ).length
  const breakdown = deductibleByCategory(filteredItems)

  function exportCsv() {
    const blob = new Blob([buildTaxCsv(filteredItems, year, treatment)], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `bookie-tax-${year}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filteredItems.length} items for ${year}.`)
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 @4xl/main:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="content-enter flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Tax</h2>
          <p className="text-sm text-muted-foreground">Deductible expenses</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor="tax-year" className="sr-only">
            Tax year
          </Label>
          <Select
            value={year}
            onValueChange={(value) => {
              if (value) setYear(value)
            }}
            items={years.map((y) => ({ label: y, value: y }))}
          >
            <SelectTrigger id="tax-year" size="sm" className="w-24">
              <SelectValue placeholder={currentYear} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Label htmlFor="tax-treatment" className="sr-only">
            Filing treatment
          </Label>
          <Select
            value={treatment}
            onValueChange={(value) => {
              if (value) setFilingTreatment(year, value as FilingTreatment)
            }}
            items={FILING_TREATMENTS.map((t) => ({
              label: TREATMENT_INFO[t].label,
              value: t,
            }))}
          >
            <SelectTrigger id="tax-treatment" size="sm" className="w-48">
              <SelectValue placeholder="Filing treatment" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {FILING_TREATMENTS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TREATMENT_INFO[t].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <DownloadIcon data-icon="inline-start" />
            Export CSV
          </Button>
          <AddExpenseDialog />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {treatmentInfo.description}
        {treatmentInfo.uncertainNote && ` ${treatmentInfo.uncertainNote}`}
      </p>
      <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        Prop-trading income classification (business / hobby / trader status)
        is unsettled and fact-dependent. This tool organizes records and
        estimates figures; it is not tax advice. Your treatment determines
        what&apos;s deductible — confirm with a CPA before filing.
      </p>
      <div className="grid grid-cols-1 gap-4 @4xl/main:grid-cols-2">
        <TaxBracketCard
          netTaxableIncome={netTaxableIncome}
          payouts={payouts}
          totalDeductible={totalDeductibleYear}
          deductionsApplied={applied}
          treatmentLabel={treatmentInfo.label}
          seTax={seTax}
          locationId={taxLocationId}
          onLocationChange={setTaxLocation}
          year={year}
        />
        <ChartTaxSensitivity
          netTaxableIncome={netTaxableIncome}
          locationId={taxLocationId}
          deductionsAllowed={applied}
        />
      </div>
      {mode === "pending" && (
        <p className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs font-medium text-amber-600 dark:text-amber-400">
          Pending classification — deduction figures below are estimates only
          and are excluded from the bracket math until you pick a filing
          treatment.
        </p>
      )}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="tax-receipts"
              className="text-xs text-muted-foreground"
            >
              Receipts
            </Label>
            <Select
              value={receiptFilter}
              onValueChange={(value) => {
                if (value) setReceiptFilter(value as ReceiptFilter)
              }}
              items={[
                { label: "All", value: "all" },
                { label: "Has receipt", value: "has" },
                { label: "Missing", value: "missing" },
              ]}
            >
              <SelectTrigger id="tax-receipts" size="sm" className="w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="has">Has receipt</SelectItem>
                  <SelectItem value="missing">Missing</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="tax-from"
                className="text-xs text-muted-foreground"
              >
                From
              </Label>
              <Input
                id="tax-from"
                type="date"
                className="h-7 w-36"
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label
                htmlFor="tax-to"
                className="text-xs text-muted-foreground"
              >
                To
              </Label>
              <Input
                id="tax-to"
                type="date"
                className="h-7 w-36"
                min={`${year}-01-01`}
                max={`${year}-12-31`}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-xs text-muted-foreground">Categories</Label>
          <ToggleGroup
            multiple
            variant="outline"
            className="flex-wrap"
            value={categories}
            onValueChange={(value) => setCategories(value as TaxCategory[])}
          >
            {TAX_CATEGORIES.map((category) => (
              <ToggleGroupItem key={category} value={category} size="sm">
                {TAX_CATEGORY_LABELS[category]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-3">
        {mode === "info" ? (
          <Card className="@container/card @xl/main:col-span-2">
            <CardHeader>
              <CardTitle>Trader Tax Status</CardTitle>
              <CardDescription>
                Simple expense-netting is not applied under this treatment
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
              <p>{treatmentInfo.rule}</p>
              <p>{treatmentInfo.uncertainNote}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                render={
                  <a
                    href={treatmentInfo.sources[0]}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                IRS Topic 429
                <ExternalLinkIcon data-icon="inline-end" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Total Deductible · {year}</CardDescription>
                <CardTitle
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    mode === "disallowed" && "line-through opacity-60",
                    mode === "pending" && "text-muted-foreground italic"
                  )}
                >
                  {formatCurrency(filteredTotal)}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {mode === "disallowed"
                      ? "Not deductible (hobby)"
                      : mode === "pending"
                        ? "Pending classification"
                        : `${filteredItems.length} items`}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {formatCurrency(fromAccountsTotal)} auto from accounts ·{" "}
                {formatCurrency(filteredTotal - fromAccountsTotal)} standalone
              </CardContent>
            </Card>
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>Estimated Tax Saved</CardDescription>
                <CardTitle
                  className={cn(
                    "text-2xl font-semibold tabular-nums",
                    mode === "pending" && "text-muted-foreground italic"
                  )}
                >
                  {mode === "disallowed"
                    ? formatCurrency(0)
                    : formatCurrency(filteredTotal * marginalRate)}
                </CardTitle>
                {mode === "pending" && (
                  <CardAction>
                    <Badge variant="outline">Pending classification</Badge>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {mode === "disallowed"
                  ? "Hobby expenses are nondeductible (TCJA, made permanent by OBBBA)."
                  : mode === "pending"
                    ? `If classified as business: deductible × ${formatPct(marginalRate)} marginal rate`
                    : `Deductible × ${formatPct(marginalRate)} marginal rate`}
              </CardContent>
            </Card>
          </>
        )}
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Receipts</CardDescription>
            <CardTitle
              className={cn(
                "text-2xl font-semibold tabular-nums",
                missingReceipts.length > 0 &&
                  "text-rose-500 dark:text-rose-400"
              )}
            >
              {missingReceipts.length} missing
            </CardTitle>
            <CardAction>
              <Badge variant="outline">{attachedCount} attached</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {missingReceipts.length > 0
              ? `${formatCurrency(missingTotal)} of expenses lack substantiation — attach receipts before filing.`
              : "Every manual expense has a receipt attached."}
          </CardContent>
        </Card>
      </div>
      <Card
        className={cn(
          "@container/card",
          mode === "disallowed" && "opacity-70"
        )}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Category Breakdown
            {mode === "disallowed" && (
              <Badge variant="outline">Not deductible (hobby)</Badge>
            )}
            {mode === "pending" && (
              <Badge variant="outline">Pending classification</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Deductible dollars grouped the way a Schedule C wants them
          </CardDescription>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing deductible matches the current filters.
            </p>
          ) : (
            <ChartContainer
              config={categoryChartConfig}
              className="aspect-auto w-full"
              style={{ height: Math.max(breakdown.length * 44, 120) }}
            >
              <BarChart
                data={breakdown.map((b) => ({
                  ...b,
                  label: TAX_CATEGORY_LABELS[b.category],
                }))}
                layout="vertical"
                margin={{ left: 12, right: 12 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={150}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="total"
                  fill="var(--color-total)"
                  radius={4}
                  name="Deductible"
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
      <TaxExpenseTable
        items={filteredItems}
        deductionMode={mode}
        onRemove={(id) => {
          removeExpense(id)
          toast.success("Expense removed.")
        }}
      />
    </div>
  )
}
