"use client"

import Link from "next/link"

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { ChartFirmRadar } from "@/components/chart-firm-radar"
import { ChartMonthlySpend } from "@/components/chart-monthly-spend"
import { ChartRecoveryRadial } from "@/components/chart-recovery-radial"
import { ChartSpendByFeeType } from "@/components/chart-spend-by-fee-type"
import { ChartSpendStacked } from "@/components/chart-spend-stacked"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useAccounts } from "@/lib/store"
import { ChartPieIcon, PlusIcon } from "lucide-react"

export default function Page() {
  const { hydrated, accounts, transactions } = useAccounts()

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
        <div className="px-4 lg:px-6">
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-4 md:py-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ChartPieIcon />
            </EmptyMedia>
            <EmptyTitle>No accounts yet</EmptyTitle>
            <EmptyDescription>
              The dashboard is a rollup of your prop-firm accounts. Add your
              first account and its fees, payouts, and refunds will populate
              every chart here.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link href="/accounts" />}>
              <PlusIcon data-icon="inline-start" />
              Add an account
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 md:gap-6 lg:px-6 @4xl/main:grid-cols-2">
        <ChartSpendByFeeType />
        <ChartMonthlySpend />
        <ChartSpendStacked />
        <ChartRecoveryRadial />
        <div className="@4xl/main:col-span-2">
          <ChartFirmRadar />
        </div>
      </div>
      <DataTable data={transactions} />
    </div>
  )
}
