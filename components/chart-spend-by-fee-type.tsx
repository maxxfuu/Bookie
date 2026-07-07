"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"

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
import { formatCurrency, grossFees, spendByFeeType } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"

const chartConfig = {
  amount: {
    label: "Spend",
  },
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

export function ChartSpendByFeeType() {
  const { transactions } = useAccounts()
  const { chartData, totalSpend } = React.useMemo(
    () => ({
      chartData: spendByFeeType(transactions).map((entry) => ({
        ...entry,
        fill: `var(--color-${entry.feeType})`,
      })),
      totalSpend: grossFees(transactions),
    }),
    [transactions]
  )

  return (
    <Card className="@container/card flex flex-col">
      <CardHeader>
        <CardTitle>Where did my money go?</CardTitle>
        <CardDescription>All-time spend by fee type</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="feeType"
              innerRadius={60}
              strokeWidth={5}
            >
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
                          y={(viewBox.cy || 0) - 6}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {formatCurrency(totalSpend)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-muted-foreground"
                        >
                          gross fees
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
        {chartData.map((entry) => (
          <div key={entry.feeType} className="flex items-center gap-1.5">
            <span
              className="size-2 shrink-0 rounded-[2px]"
              style={{ backgroundColor: chartConfig[entry.feeType].color }}
            />
            <span className="text-muted-foreground">
              {chartConfig[entry.feeType].label}
            </span>
          </div>
        ))}
      </CardFooter>
    </Card>
  )
}
