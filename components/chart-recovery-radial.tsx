"use client"

import * as React from "react"
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  cumulativeNetSpend,
  formatCurrency,
  recoveryRatio,
} from "@/lib/selectors"
import { useAccounts } from "@/lib/store"

const chartConfig = {
  value: {
    label: "Recovered",
  },
  recovered: {
    label: "Recovered",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartRecoveryRadial() {
  const { transactions } = useAccounts()
  const { ratio, netSpend } = React.useMemo(
    () => ({
      ratio: recoveryRatio(transactions),
      netSpend: cumulativeNetSpend(transactions),
    }),
    [transactions]
  )
  const chartData = [
    {
      name: "recovered",
      value: Math.min(ratio, 1) * 100,
      fill: "var(--color-recovered)",
    },
  ]

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader>
        <CardTitle>How close to breakeven?</CardTitle>
        <CardDescription>
          Payouts as a share of gross spend — a full ring is breakeven
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadialBarChart
            data={chartData}
            startAngle={90}
            endAngle={90 - Math.min(ratio, 1) * 360}
            innerRadius={80}
            outerRadius={110}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="name" />}
            />
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {(ratio * 100).toFixed(1)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          recovered
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-1.5 text-sm">
        <div className="font-medium">
          {formatCurrency(Math.abs(netSpend))}{" "}
          {netSpend >= 0 ? "still in the hole" : "past breakeven"}
        </div>
        <div className="text-muted-foreground">
          Net of payouts and received refunds
        </div>
      </CardFooter>
    </Card>
  )
}
