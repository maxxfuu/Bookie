"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
import {
  formatMonth,
  monthlySpendByFeeType,
  SPEND_FEE_TYPES,
} from "@/lib/selectors"
import { useAccounts } from "@/lib/store"

const chartConfig = {
  eval: {
    label: "Eval Fees",
    color: "var(--chart-1)",
  },
  reset: {
    label: "Resets",
    color: "var(--chart-2)",
  },
  activation: {
    label: "Activation",
    color: "var(--chart-3)",
  },
  addon: {
    label: "Add-ons",
    color: "var(--chart-4)",
  },
  recurring: {
    label: "Recurring",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function ChartSpendStacked() {
  const { transactions } = useAccounts()
  const chartData = React.useMemo(
    () => monthlySpendByFeeType(transactions),
    [transactions]
  )

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Spend by Category</CardTitle>
        <CardDescription>Monthly spend stacked by fee type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatMonth}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatMonth(String(value))}
                  indicator="dot"
                />
              }
            />
            {SPEND_FEE_TYPES.map((feeType) => (
              <Area
                key={feeType}
                dataKey={feeType}
                type="monotone"
                fill={`var(--color-${feeType})`}
                fillOpacity={0.4}
                stroke={`var(--color-${feeType})`}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
