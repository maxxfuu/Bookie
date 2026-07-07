"use client"

import * as React from "react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  accountSummaries,
  costPerFundedAccount,
  deductibleItems,
  formatCurrency,
  fundedAccountCount,
  grossFees,
  payoutsInYear,
  recoveryRatio,
  totalNetProfit,
  totalPayouts,
  totalRefundsReceived,
} from "@/lib/selectors"
import { formatPct, stackedTaxFor, taxLocationById } from "@/lib/tax-rates"
import { useAccounts } from "@/lib/store"
import { cn } from "@/lib/utils"

function ReceiptLine({
  label,
  value,
  bold = false,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between gap-2 tabular-nums",
        bold && "font-bold"
      )}
    >
      <span className="truncate uppercase">{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  )
}

function ReceiptRule() {
  return <div className="border-t border-dashed" />
}

export default function Page() {
  const { hydrated, accounts, transactions, expenses, taxLocationId } =
    useAccounts()
  const [printedAt] = React.useState(() => new Date())
  const [receiptNo] = React.useState(() =>
    Math.floor(Math.random() * 1_000_000)
  )

  const summaries = React.useMemo(
    () => accountSummaries(accounts, transactions),
    [accounts, transactions]
  )
  const year = String(printedAt.getFullYear())
  const yearDeductibles = React.useMemo(
    () => deductibleItems(transactions, expenses, year),
    [transactions, expenses, year]
  )

  if (!hydrated) {
    return (
      <div className="flex justify-center px-4 py-4 md:py-6">
        <Skeleton className="h-[480px] w-full max-w-sm rounded-xl" />
      </div>
    )
  }

  const gross = grossFees(transactions)
  const payouts = totalPayouts(transactions)
  const refunds = totalRefundsReceived(transactions)
  const netProfit = totalNetProfit(transactions)
  const funded = fundedAccountCount(transactions)
  const deductibleTotal = yearDeductibles.reduce(
    (sum, i) => sum + i.deductibleValue,
    0
  )
  const yearPayouts = payoutsInYear(transactions, year)
  const netTaxable = Math.max(yearPayouts - deductibleTotal, 0)
  const location = taxLocationById(taxLocationId)
  const estTax = stackedTaxFor(location, netTaxable)

  return (
    <div className="content-enter flex justify-center px-4 py-4 md:py-6">
      <div className="w-full max-w-sm bg-card px-6 py-8 font-mono text-xs text-card-foreground shadow-md">
        <div className="flex flex-col items-center gap-1 text-center">
          <span className="text-lg font-bold tracking-widest">BOOKIE</span>
          <span className="text-muted-foreground">
            PROP FIRM COST TRACKER
          </span>
          <span className="text-muted-foreground">
            {printedAt
              .toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })
              .toUpperCase()}
          </span>
          <span className="text-muted-foreground">
            RECEIPT #{String(receiptNo).padStart(6, "0")}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <ReceiptRule />
          <span className="text-center font-bold">— DASHBOARD —</span>
          <ReceiptRule />
          <ReceiptLine label="Gross fees" value={formatCurrency(gross)} />
          <ReceiptLine label="Payouts" value={formatCurrency(payouts)} />
          <ReceiptLine label="Refunds" value={formatCurrency(refunds)} />
          <ReceiptLine
            label="Recovery ratio"
            value={formatPct(recoveryRatio(transactions))}
          />
          <ReceiptLine
            label="Funded / attempts"
            value={`${funded}/${accounts.length}`}
          />
          <ReceiptLine
            label="Cost per funded"
            value={
              funded > 0
                ? formatCurrency(costPerFundedAccount(transactions))
                : "—"
            }
          />
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <ReceiptRule />
          <span className="text-center font-bold">
            — ACCOUNTS ({accounts.length}) —
          </span>
          <ReceiptRule />
          {summaries.length === 0 ? (
            <span className="text-center text-muted-foreground">
              NO ITEMS
            </span>
          ) : (
            summaries.map(({ account, phase, netProfit: acctNet }) => (
              <div key={account.id} className="flex flex-col">
                <ReceiptLine
                  label={account.nickname}
                  value={`${acctNet > 0 ? "+" : ""}${formatCurrency(acctNet)}`}
                />
                <span className="text-muted-foreground uppercase">
                  {account.firm} · {account.accountSize / 1000}K · {phase}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <ReceiptRule />
          <span className="text-center font-bold">
            — TAX {year} ({location.state.toUpperCase()}) —
          </span>
          <ReceiptRule />
          <ReceiptLine
            label={`Payouts ${year}`}
            value={formatCurrency(yearPayouts)}
          />
          <ReceiptLine
            label="Deductible"
            value={`-${formatCurrency(deductibleTotal)}`}
          />
          <ReceiptLine label="Net taxable" value={formatCurrency(netTaxable)} />
          {estTax.layers.map((layer) => (
            <ReceiptLine
              key={layer.name}
              label={`${layer.name} tax`}
              value={formatCurrency(layer.tax)}
            />
          ))}
          <ReceiptLine
            label="Est. tax total"
            value={formatCurrency(estTax.total)}
            bold
          />
        </div>

        <div className="mt-5 flex flex-col gap-1.5">
          <ReceiptRule />
          <div className="flex justify-between text-sm font-bold tabular-nums">
            <span>NET PROFIT</span>
            <span>
              {netProfit > 0 ? "+" : ""}
              {formatCurrency(netProfit)}
            </span>
          </div>
          <ReceiptRule />
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="h-10 w-48"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 4px, currentColor 4px 7px, transparent 7px 9px)",
            }}
          />
          <span className="tracking-widest text-muted-foreground">
            *** MADE BY BOOKIE ***
          </span>
        </div>
      </div>
    </div>
  )
}
