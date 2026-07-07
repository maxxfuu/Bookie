"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  costPerFundedAccount,
  cumulativeNetSpend,
  formatCurrency,
  fundedAccountCount,
  grossFees,
  monthlyNetFlow,
  recoveryRatio,
  recoveryTrend,
  totalPayouts,
  totalRefundsReceived,
} from "@/lib/selectors"
import { useAccounts } from "@/lib/store"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export function SectionCards() {
  const { accounts, transactions } = useAccounts()

  const {
    netSpend,
    gross,
    recovered,
    costPerFunded,
    funded,
    recovery,
    trend,
    lastMonthNet,
  } = React.useMemo(() => {
    const flows = monthlyNetFlow(transactions)
    return {
      netSpend: cumulativeNetSpend(transactions),
      gross: grossFees(transactions),
      recovered:
        totalPayouts(transactions) + totalRefundsReceived(transactions),
      costPerFunded: costPerFundedAccount(transactions),
      funded: fundedAccountCount(transactions),
      recovery: recoveryRatio(transactions),
      trend: recoveryTrend(transactions),
      lastMonthNet: flows[flows.length - 1]?.net ?? 0,
    }
  }, [transactions])

  const attempts = accounts.length
  const passRate = attempts === 0 ? 0 : funded / attempts

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Net Spend</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(netSpend)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {lastMonthNet <= 0 ? <TrendingDownIcon /> : <TrendingUpIcon />}
              {formatCurrency(lastMonthNet)} last mo
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {lastMonthNet <= 0 ? (
              <>
                Payouts outpaced fees last month{" "}
                <TrendingDownIcon className="size-4" />
              </>
            ) : (
              <>
                Still burning cash <TrendingUpIcon className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            {formatCurrency(gross)} spent · {formatCurrency(recovered)}{" "}
            recovered
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cost per Funded Account</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {funded > 0 ? formatCurrency(costPerFunded) : "—"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">{funded} funded</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Eval + reset spend per funded account
          </div>
          <div className="text-muted-foreground">
            Across {attempts} challenge{" "}
            {attempts === 1 ? "attempt" : "attempts"}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Recovery Ratio</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(recovery * 100).toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {trend.deltaPoints >= 0 ? (
                <TrendingUpIcon />
              ) : (
                <TrendingDownIcon />
              )}
              {trend.deltaPoints >= 0 ? "+" : ""}
              {trend.deltaPoints.toFixed(1)} pts
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {trend.deltaPoints >= 0 ? (
              <>
                Closing in on breakeven <TrendingUpIcon className="size-4" />
              </>
            ) : (
              <>
                Falling behind breakeven <TrendingDownIcon className="size-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground">
            Payouts vs gross spend · breakeven at 100%
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Funded / Attempts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {funded} / {attempts}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              {(passRate * 100).toFixed(0)}% pass
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Accounts that reached funded status
          </div>
          <div className="text-muted-foreground">
            Every failed attempt is sunk acquisition cost
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
