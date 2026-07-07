"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Field, FieldLabel } from "@/components/ui/field"
import { Slider } from "@/components/ui/slider"
import { formatCurrency } from "@/lib/selectors"
import {
  bracketIndexFor,
  FEDERAL_LAYER,
  formatPct,
  stackedTaxFor,
  taxLocationById,
} from "@/lib/tax-rates"
import { cn, signedClass } from "@/lib/utils"

const chartConfig = {
  rate: {
    label: "Federal marginal %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const compactCurrency = (value: number) =>
  value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`

export function ChartTaxSensitivity({
  netTaxableIncome,
  locationId,
  deductionsAllowed,
}: {
  netTaxableIncome: number
  locationId: string
  /** When the filing treatment disallows deductions, write-offs can't move the marker. */
  deductionsAllowed: boolean
}) {
  const [addPayouts, setAddPayouts] = React.useState(0)
  const [addWriteoffs, setAddWriteoffs] = React.useState(0)

  const location = taxLocationById(locationId)
  const income = Math.max(netTaxableIncome, 0)
  const effectiveWriteoffs = deductionsAllowed ? addWriteoffs : 0
  const adjusted = Math.max(income + addPayouts - effectiveWriteoffs, 0)

  const currentStack = stackedTaxFor(location, income)
  const adjustedStack = stackedTaxFor(location, adjusted)
  const taxDelta = adjustedStack.total - currentStack.total

  const currentIdx = bracketIndexFor(FEDERAL_LAYER.brackets, income)
  const adjustedIdx = bracketIndexFor(FEDERAL_LAYER.brackets, adjusted)

  const domainMax =
    Math.ceil(Math.max(income, adjusted, 110000) / 50000) * 50000 * 1.2

  const chartData = React.useMemo(() => {
    const points: { income: number; rate: number }[] = []
    let floor = 0
    for (const bracket of FEDERAL_LAYER.brackets) {
      if (floor > domainMax) break
      points.push({ income: floor, rate: bracket.rate * 100 })
      floor = bracket.upTo ?? Infinity
    }
    const lastRate = points[points.length - 1]?.rate ?? 0
    points.push({ income: domainMax, rate: lastRate })
    return points
  }, [domainMax])

  const crossingMessage =
    adjustedIdx > currentIdx
      ? `This change pushes you into the ${formatPct(
          FEDERAL_LAYER.brackets[adjustedIdx].rate,
          0
        )} federal bracket - only the dollars above ${formatCurrency(
          FEDERAL_LAYER.brackets[adjustedIdx - 1].upTo ?? 0
        )} are taxed at it.`
      : adjustedIdx < currentIdx
        ? `Write-offs pull you back into the ${formatPct(
            FEDERAL_LAYER.brackets[adjustedIdx].rate,
            0
          )} federal bracket.`
        : "No bracket boundary crossed - only your marginal slice changes."

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader>
        <CardTitle>Bracket Sensitivity</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ left: 4, right: 12, top: 10 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="income"
              type="number"
              domain={[0, domainMax]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={compactCurrency}
            />
            <YAxis
              dataKey="rate"
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    `Taxable income ${formatCurrency(Number(value))}`
                  }
                />
              }
            />
            <Area
              dataKey="rate"
              type="stepAfter"
              stroke="var(--color-rate)"
              fill="var(--color-rate)"
              fillOpacity={0.15}
            />
            <ReferenceLine
              x={income}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: "Now",
                position: "insideTopLeft",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            {adjusted !== income && (
              <ReferenceLine
                x={adjusted}
                stroke={
                  taxDelta > 0
                    ? "var(--color-rose-500)"
                    : "var(--color-green-500)"
                }
                label={{
                  value: "What-if",
                  position: "insideTopRight",
                  fill:
                    taxDelta > 0
                      ? "var(--color-rose-500)"
                      : "var(--color-green-500)",
                  fontSize: 11,
                }}
              />
            )}
          </AreaChart>
        </ChartContainer>
        <div className="grid gap-4 @sm/card:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="sens-payouts">
              Additional payouts: +{formatCurrency(addPayouts)}
            </FieldLabel>
            <Slider
              id="sens-payouts"
              value={[addPayouts]}
              onValueChange={(value) =>
                setAddPayouts(Array.isArray(value) ? (value[0] ?? 0) : value)
              }
              min={0}
              max={100000}
              step={500}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="sens-writeoffs">
              {deductionsAllowed
                ? `Additional write-offs: +${formatCurrency(addWriteoffs)}`
                : "Write-offs don't apply to this treatment"}
            </FieldLabel>
            <Slider
              id="sens-writeoffs"
              value={[deductionsAllowed ? addWriteoffs : 0]}
              onValueChange={(value) =>
                setAddWriteoffs(Array.isArray(value) ? (value[0] ?? 0) : value)
              }
              min={0}
              max={50000}
              step={250}
              disabled={!deductionsAllowed}
            />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm tabular-nums">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              What-if bracket
            </span>
            <span className="font-medium">
              {formatPct(FEDERAL_LAYER.brackets[adjustedIdx].rate, 0)} federal
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Marginal at that point
            </span>
            <span className="font-medium">
              {formatPct(adjustedStack.marginalRate)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              Est. tax delta
            </span>
            <span className={cn("font-medium", signedClass(-taxDelta))}>
              {taxDelta >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(taxDelta))}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{crossingMessage}</p>
      </CardContent>
    </Card>
  )
}
