"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ReferenceArea, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  breakevenDate,
  cumulativeSeries,
  formatCurrency,
  recoveryRatio,
} from "@/lib/selectors"
import { useAccounts } from "@/lib/store"

export const description = "Cumulative spend vs payouts over time"

const chartConfig = {
  spend: {
    label: "Total Spend",
    color: "var(--color-rose-500)",
  },
  payouts: {
    label: "Total Payouts",
    color: "var(--color-green-500)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const { transactions } = useAccounts()
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("all")
  const [prevIsMobile, setPrevIsMobile] = React.useState(isMobile)

  // Adjust the default range when crossing the mobile breakpoint (render-time
  // state adjustment instead of an effect — see react.dev/learn/you-might-not-need-an-effect).
  if (isMobile !== prevIsMobile) {
    setPrevIsMobile(isMobile)
    if (isMobile) {
      setTimeRange("90d")
    }
  }

  const chartData = React.useMemo(
    () => cumulativeSeries(transactions),
    [transactions]
  )
  // Ranges anchor to the last logged transaction, not the wall clock.
  const lastDate = chartData[chartData.length - 1]?.date
  const filteredData = chartData.filter((item) => {
    if (timeRange === "all" || !lastDate) {
      return true
    }
    const date = new Date(item.date)
    const daysToSubtract = timeRange === "90d" ? 90 : 180
    const startDate = new Date(lastDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const crossover = breakevenDate(transactions)
  const crossoverInRange =
    crossover !== null && filteredData.some((p) => p.date >= crossover)
  const recoveredPct = (recoveryRatio(transactions) * 100).toFixed(1)
  const latest = chartData[chartData.length - 1]
  const gap = latest ? latest.spend - latest.payouts : 0

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Spend vs Payouts</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Cumulative spend vs payouts · {recoveredPct}% recovered ·{" "}
            {formatCurrency(gap)} to breakeven
          </span>
          <span className="@[540px]/card:hidden">
            {recoveredPct}% recovered
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "all")
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="all">All time</ToggleGroupItem>
            <ToggleGroupItem value="180d">Last 6 months</ToggleGroupItem>
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value)
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="All time" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All time
              </SelectItem>
              <SelectItem value="180d" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-spend)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-spend)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillPayouts" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-payouts)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-payouts)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            {crossoverInRange && (
              <ReferenceArea
                x1={crossover}
                x2={filteredData[filteredData.length - 1]?.date}
                fill="var(--color-payouts)"
                fillOpacity={0.08}
                label={{
                  value: "Breakeven",
                  position: "insideTopRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
            )}
            <Area
              dataKey="spend"
              type="monotone"
              fill="url(#fillSpend)"
              stroke="var(--color-spend)"
            />
            <Area
              dataKey="payouts"
              type="monotone"
              fill="url(#fillPayouts)"
              stroke="var(--color-payouts)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
