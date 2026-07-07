"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useAccounts } from "@/lib/store"
import { localISODate } from "@/lib/utils"
import type { Account, BreachReason, LogEventInput, Phase } from "@/lib/types"

type EventKind = LogEventInput["type"]

const EVENT_LABELS: Record<EventKind, string> = {
  reset: "Reset",
  "phase-change": "Phase change",
  payout: "Payout",
  refund: "Refund",
  addon: "Add-on",
}

// "phase1"/"phase2" remain in the data model for saved accounts, but the UI
// presents a single evaluation stage ("phase1" internally).
const PHASE_OPTIONS: { label: string; value: Phase }[] = [
  { label: "Evaluation", value: "phase1" },
  { label: "Funded", value: "funded" },
  { label: "Breached", value: "breached" },
]

const BREACH_OPTIONS: { label: string; value: BreachReason }[] = [
  { label: "Daily drawdown", value: "daily-drawdown" },
  { label: "Max drawdown", value: "max-drawdown" },
  { label: "Consistency rule", value: "consistency" },
  { label: "Other", value: "other" },
]

function todayISO() {
  return localISODate()
}

export function LogEventDialog({
  account,
  onClose,
}: {
  account: Account
  onClose: () => void
}) {
  const { logEvent } = useAccounts()
  const [kind, setKind] = React.useState<EventKind>("payout")
  const [date, setDate] = React.useState(todayISO())
  const [amount, setAmount] = React.useState("")
  const [phase, setPhase] = React.useState<Phase>("funded")
  const [activationFee, setActivationFee] = React.useState("")
  const [breachReason, setBreachReason] =
    React.useState<BreachReason>("daily-drawdown")
  const [profitSplitPct, setProfitSplitPct] = React.useState("")
  const [addonName, setAddonName] = React.useState("")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const value = Number(amount) || 0
    let input: LogEventInput
    switch (kind) {
      case "reset":
        if (value <= 0) {
          toast.error("Reset cost must be greater than zero.")
          return
        }
        input = { type: "reset", date, cost: value }
        break
      case "phase-change":
        input = {
          type: "phase-change",
          date,
          phase,
          activationFee:
            phase === "funded" ? Number(activationFee) || 0 : undefined,
          breachReason: phase === "breached" ? breachReason : undefined,
        }
        break
      case "payout":
        if (value <= 0) {
          toast.error("Payout amount must be greater than zero.")
          return
        }
        input = {
          type: "payout",
          date,
          amount: value,
          profitSplitPct: profitSplitPct ? Number(profitSplitPct) : undefined,
        }
        break
      case "refund":
        if (value <= 0) {
          toast.error("Refund amount must be greater than zero.")
          return
        }
        input = { type: "refund", date, amount: value }
        break
      case "addon":
        if (addonName.trim() === "") {
          toast.error("Add-on name is required.")
          return
        }
        input = { type: "addon", date, name: addonName.trim(), cost: value }
        break
    }
    logEvent(account.id, input)
    toast.success(`${EVENT_LABELS[kind]} logged on ${account.nickname}.`)
    onClose()
  }

  const needsAmount = kind !== "phase-change"
  const amountLabel =
    kind === "payout"
      ? "Payout amount"
      : kind === "refund"
        ? "Refund amount"
        : "Cost"

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log event - {account.nickname}</DialogTitle>
          <DialogDescription>
            Each event becomes a transaction and recomputes every chart and KPI
            on the dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Event type</FieldLabel>
              <ToggleGroup
                multiple={false}
                variant="outline"
                className="w-full flex-wrap"
                value={[kind]}
                onValueChange={(value) => {
                  if (value[0]) setKind(value[0] as EventKind)
                }}
              >
                {(Object.keys(EVENT_LABELS) as EventKind[]).map((k) => (
                  <ToggleGroupItem key={k} value={k}>
                    {EVENT_LABELS[k]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="event-date">Date</FieldLabel>
              <Input
                id="event-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Field>
            {kind === "phase-change" && (
              <Field>
                <FieldLabel htmlFor="event-phase">New phase</FieldLabel>
                <Select
                  value={phase}
                  onValueChange={(value) => {
                    if (value) setPhase(value as Phase)
                  }}
                  items={PHASE_OPTIONS}
                >
                  <SelectTrigger id="event-phase" className="w-full">
                    <SelectValue placeholder="Select a phase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PHASE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
            {kind === "phase-change" && phase === "funded" && (
              <Field>
                <FieldLabel htmlFor="event-activation">
                  Activation fee
                </FieldLabel>
                <Input
                  id="event-activation"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={activationFee}
                  onChange={(e) => setActivationFee(e.target.value)}
                />
                <FieldDescription>
                  Leave 0 if the firm funds without an activation fee.
                </FieldDescription>
              </Field>
            )}
            {kind === "phase-change" && phase === "breached" && (
              <Field>
                <FieldLabel htmlFor="event-breach">Breach reason</FieldLabel>
                <Select
                  value={breachReason}
                  onValueChange={(value) => {
                    if (value) setBreachReason(value as BreachReason)
                  }}
                  items={BREACH_OPTIONS}
                >
                  <SelectTrigger id="event-breach" className="w-full">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {BREACH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
            {kind === "addon" && (
              <Field>
                <FieldLabel htmlFor="event-addon-name">Add-on name</FieldLabel>
                <Input
                  id="event-addon-name"
                  placeholder="Higher split"
                  value={addonName}
                  onChange={(e) => setAddonName(e.target.value)}
                  required
                />
              </Field>
            )}
            {needsAmount && (
              <Field>
                <FieldLabel htmlFor="event-amount">{amountLabel}</FieldLabel>
                <Input
                  id="event-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required={kind !== "addon"}
                />
              </Field>
            )}
            {kind === "payout" && (
              <Field>
                <FieldLabel htmlFor="event-split">
                  Profit split % (context)
                </FieldLabel>
                <Input
                  id="event-split"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="80"
                  value={profitSplitPct}
                  onChange={(e) => setProfitSplitPct(e.target.value)}
                />
              </Field>
            )}
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Log event</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
