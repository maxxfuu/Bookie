"use client"

import * as React from "react"
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { firmProfiles } from "@/lib/firms"
import { firmStats, type FirmStats } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"
import { FIRM_NAMES, type Firm } from "@/lib/types"

const round = (value: number) => Math.round(value * 10) / 10

const metrics = [
  "Avg fee",
  "Pass rate",
  "Profit split",
  "Payout speed",
  "Rule leniency",
] as const

/** Score one firm 0–100 on each axis, higher = better deal. */
function scoresFor(firm: Firm, stats: FirmStats[]) {
  const stat = stats.find((s) => s.firm === firm)
  const profile = firmProfiles.find((p) => p.firm === firm)
  if (!stat || !profile) return null
  const minFee = Math.min(
    ...stats.filter((s) => s.avgEvalFee > 0).map((s) => s.avgEvalFee)
  )
  const maxPass = Math.max(...stats.map((s) => s.passRate))
  const maxSplit = Math.max(...firmProfiles.map((p) => p.profitSplit))
  const minDays = Math.min(...firmProfiles.map((p) => p.payoutSpeedDays))
  const minStrict = Math.min(...firmProfiles.map((p) => p.ruleStrictness))
  return {
    "Avg fee": round(
      stat.avgEvalFee === 0 ? 0 : (minFee / stat.avgEvalFee) * 100
    ),
    "Pass rate": round(maxPass === 0 ? 0 : (stat.passRate / maxPass) * 100),
    "Profit split": round((profile.profitSplit / maxSplit) * 100),
    "Payout speed": round((minDays / profile.payoutSpeedDays) * 100),
    "Rule leniency": round((minStrict / profile.ruleStrictness) * 100),
  }
}

// One entry per supported firm, cycling through the five chart tokens.
const chartConfig = Object.fromEntries(
  FIRM_NAMES.map((firm, index) => [
    firm,
    { label: firm, color: `var(--chart-${(index % 5) + 1})` },
  ])
) satisfies ChartConfig

export function ChartFirmRadar() {
  const { transactions } = useAccounts()
  const { chartData, activeFirms } = React.useMemo(() => {
    const stats = firmStats(transactions)
    const active = firmProfiles
      .map((p) => p.firm)
      .filter((firm) => stats.some((s) => s.firm === firm))
    const data = metrics.map((metric) => {
      const row: Record<string, number | string> = { metric }
      for (const firm of active) {
        row[firm] = scoresFor(firm, stats)?.[metric] ?? 0
      }
      return row
    })
    return { chartData: data, activeFirms: active }
  }, [transactions])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Firm Comparison</CardTitle>
        <CardDescription>
          Scored 0–100 per axis relative to the best firm — higher is better.
          Only firms you hold accounts with are plotted.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-auto h-[320px] w-full"
        >
          <RadarChart data={chartData} outerRadius="70%">
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis dataKey="metric" />
            <PolarGrid />
            {activeFirms.map((firm) => (
              <Radar
                key={firm}
                dataKey={firm}
                fill={`var(--color-${firm})`}
                fillOpacity={0.1}
                stroke={`var(--color-${firm})`}
                strokeWidth={2}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} className="mt-4" />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
