"use client"

import * as React from "react"
import { toast } from "sonner"

import { AddAccountDialog } from "@/components/add-account-dialog"
import { LogEventDialog } from "@/components/log-event-dialog"
import { PhaseBadge } from "@/components/phase-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { accountSummaries, formatCurrency } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"
import { cn, signedClass } from "@/lib/utils"
import type { Account, ProgramType } from "@/lib/types"
import { EllipsisVerticalIcon, WalletIcon } from "lucide-react"

const PROGRAM_LABELS: Record<ProgramType, string> = {
  "one-step": "1-step",
  "two-step": "2-step",
  instant: "Instant",
}

export default function Page() {
  const { hydrated, accounts, transactions, removeAccount } = useAccounts()
  const [logTarget, setLogTarget] = React.useState<Account | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(
    () => new Set()
  )

  const summaries = React.useMemo(
    () => accountSummaries(accounts, transactions),
    [accounts, transactions]
  )

  // Ignore stale ids (e.g. after a removal) without an extra effect.
  const selected = React.useMemo(
    () =>
      new Set(accounts.map((a) => a.id).filter((id) => selectedIds.has(id))),
    [accounts, selectedIds]
  )
  const allSelected = accounts.length > 0 && selected.size === accounts.length

  function toggleAll(checked: boolean) {
    setSelectedIds(checked ? new Set(accounts.map((a) => a.id)) : new Set())
  }

  function toggleOne(accountId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(accountId)
      } else {
        next.delete(accountId)
      }
      return next
    })
  }

  function removeSelected() {
    for (const id of selected) {
      removeAccount(id)
    }
    setSelectedIds(new Set())
    toast.success(
      `Removed ${selected.size} ${selected.size === 1 ? "account" : "accounts"} and their transactions.`
    )
  }

  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4 px-4 py-4 md:py-6 lg:px-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Every challenge you&apos;ve bought. The dashboard is a rollup of
            what happens here.
          </p>
        </div>
        <AddAccountDialog />
      </div>
      {accounts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed py-16">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WalletIcon />
              </EmptyMedia>
              <EmptyTitle>No accounts yet</EmptyTitle>
              <EmptyDescription>
                Add a challenge account manually or import a CSV/JSON file. Its
                eval fee becomes your first logged transaction.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <AddAccountDialog />
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted">
              <TableRow>
                <TableHead className="w-8">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selected.size > 0 && !allSelected}
                      onCheckedChange={(checked) => toggleAll(!!checked)}
                      aria-label="Select all accounts"
                    />
                  </div>
                </TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">Payouts</TableHead>
                <TableHead className="text-right">Net P/L</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(({ account, phase, spend, payouts, netProfit }) => (
                <TableRow
                  key={account.id}
                  data-state={selected.has(account.id) && "selected"}
                >
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={selected.has(account.id)}
                        onCheckedChange={(checked) =>
                          toggleOne(account.id, !!checked)
                        }
                        aria-label={`Select ${account.nickname}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{account.nickname}</span>
                      <span className="text-xs text-muted-foreground">
                        {account.externalId || "Account ID not provided"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="px-1.5 text-muted-foreground"
                    >
                      {account.firm}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(account.accountSize)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {PROGRAM_LABELS[account.programType]}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {new Date(
                      `${account.startDate}T00:00:00`
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
                    <PhaseBadge phase={phase} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(spend)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {payouts > 0 ? (
                      formatCurrency(payouts)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium tabular-nums",
                      signedClass(netProfit)
                    )}
                  >
                    {netProfit > 0 ? "+" : ""}
                    {formatCurrency(netProfit)}
                  </TableCell>
                  <TableCell className="w-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground data-open:bg-muted"
                          />
                        }
                      >
                        <EllipsisVerticalIcon />
                        <span className="sr-only">
                          Open menu for {account.nickname}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setLogTarget(account)}>
                          Log event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            removeAccount(account.id)
                            toast.success(
                              `Removed ${account.nickname} and its transactions.`
                            )
                          }}
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {accounts.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {selected.size} of {accounts.length}{" "}
            {accounts.length === 1 ? "account" : "accounts"} selected
          </span>
          {selected.size > 0 && (
            <Button variant="destructive" size="sm" onClick={removeSelected}>
              Remove {selected.size} selected
            </Button>
          )}
        </div>
      )}
      {logTarget && (
        <LogEventDialog
          key={logTarget.id}
          account={logTarget}
          onClose={() => setLogTarget(null)}
        />
      )}
    </div>
  )
}
