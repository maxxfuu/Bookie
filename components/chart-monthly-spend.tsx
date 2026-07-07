"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
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
import { formatMonth, monthlyBurn } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"

const chartConfig = {
  spend: {
    label: "Spend",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartMonthlySpend() {
  const { transactions } = useAccounts()
  const chartData = React.useMemo(
    () => monthlyBurn(transactions),
    [transactions]
  )

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Monthly Spend</CardTitle>
        <CardDescription>Total fees paid per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={formatMonth}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatMonth(String(value))}
                />
              }
            />
            <Bar dataKey="spend" fill="var(--color-spend)" radius={8} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
