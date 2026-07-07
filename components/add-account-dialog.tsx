"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseAccountFile, parseAccountInput } from "@/lib/account-schema"
import { parseOrderPaste } from "@/lib/order-paste"
import {
  planById,
  plansFor,
  sizesForFirm,
  type FirmPlan,
} from "@/lib/firm-catalog"
import { FIRMS, getDefaultRules } from "@/lib/firms"
import { formatCurrency } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"
import type { AccountRules, Firm, ProgramType } from "@/lib/types"
import { FileUpIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react"

/** Fallback sizes if a firm has no catalog entries yet. */
const FALLBACK_SIZES = [25000, 50000, 100000, 150000]
const CURRENCIES = [
  { value: "USD", label: "🇺🇸 USD" },
  { value: "EUR", label: "🇪🇺 EUR" },
  { value: "GBP", label: "🇬🇧 GBP" },
  { value: "CAD", label: "🇨🇦 CAD" },
  { value: "AUD", label: "🇦🇺 AUD" },
]
const PROGRAM_LABELS: Record<ProgramType, string> = {
  "one-step": "1-step",
  "two-step": "2-step",
  instant: "Instant",
}

type AddonDraft = { name: string; cost: string }

type FormState = {
  firm: Firm
  nickname: string
  externalId: string
  accountSize: string
  programType: ProgramType
  startDate: string
  currency: string
  listPrice: string
  discountCode: string
  discount: string
  refundable: boolean
  refundCondition: string
  recurringFee: string
  recurringCadence: "none" | "monthly"
  addons: AddonDraft[]
  rules: AccountRules
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

/** The plan-derived fields: what "downstream autofill" writes into the form. */
function planPatch(plan: FirmPlan): Partial<FormState> {
  return {
    firm: plan.firm,
    accountSize: String(plan.accountSize),
    programType: plan.programType,
    listPrice: String(plan.listPrice),
    refundable: plan.refundable,
    refundCondition: plan.refundCondition,
    recurringFee: plan.billing === "monthly" ? String(plan.listPrice) : "",
    recurringCadence: plan.billing === "monthly" ? "monthly" : "none",
    rules: { ...plan.rules },
  }
}

function initialForm(): FormState {
  const firm = FIRMS[0]
  const size = sizesForFirm(firm)[0]
  const plan = size !== undefined ? plansFor(firm, size)[0] : undefined
  const base: FormState = {
    firm,
    nickname: "",
    externalId: "",
    accountSize: String(size ?? FALLBACK_SIZES[1]),
    programType: "one-step",
    startDate: todayISO(),
    currency: "USD",
    listPrice: "",
    discountCode: "",
    discount: "",
    refundable: false,
    refundCondition: "",
    recurringFee: "",
    recurringCadence: "none",
    addons: [],
    rules: getDefaultRules(firm, "one-step"),
  }
  return plan ? { ...base, ...planPatch(plan) } : base
}

function initialPlanId() {
  const firm = FIRMS[0]
  const size = sizesForFirm(firm)[0]
  return size !== undefined ? (plansFor(firm, size)[0]?.id ?? "") : ""
}

const RULE_FIELDS: { key: keyof AccountRules; label: string }[] = [
  { key: "profitTargetPct", label: "Profit target %" },
  { key: "maxDrawdownPct", label: "Max drawdown %" },
  { key: "dailyDrawdownPct", label: "Daily drawdown %" },
  { key: "minTradingDays", label: "Min trading days" },
  { key: "payoutFrequencyDays", label: "Payout frequency (days)" },
  { key: "consistencyStrictness", label: "Consistency strictness (1–10)" },
]

export function AddAccountDialog() {
  const { addAccount, logEvent } = useAccounts()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(initialForm)
  const [planId, setPlanId] = React.useState<string>(initialPlanId)
  const [dragging, setDragging] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const pasteResult = React.useMemo(
    () => (pasteText.trim() === "" ? null : parseOrderPaste(pasteText)),
    [pasteText]
  )

  const patch = (fields: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...fields }))

  const firmSizes = sizesForFirm(form.firm)
  const sizeOptions = firmSizes.length > 0 ? firmSizes : FALLBACK_SIZES
  const sizePlans = plansFor(form.firm, Number(form.accountSize))
  const selectedPlan = planId ? planById(planId) : undefined

  /** Selecting a plan autofills every downstream field it knows about. */
  function applyPlan(plan: FirmPlan | undefined) {
    setPlanId(plan?.id ?? "")
    if (plan) {
      patch(planPatch(plan))
    }
  }

  function selectFirm(firm: Firm) {
    const sizes = sizesForFirm(firm)
    const size = sizes[0]
    const plan = size !== undefined ? plansFor(firm, size)[0] : undefined
    if (plan) {
      setPlanId(plan.id)
      patch({ ...planPatch(plan) })
    } else {
      setPlanId("")
      patch({
        firm,
        accountSize: String(size ?? FALLBACK_SIZES[1]),
        rules: getDefaultRules(firm, form.programType),
      })
    }
  }

  function selectSize(size: string) {
    const plan = plansFor(form.firm, Number(size))[0]
    if (plan) {
      applyPlan(plan)
    } else {
      setPlanId("")
      patch({ accountSize: size })
    }
  }

  function resetAndClose() {
    setForm(initialForm())
    setPlanId(initialPlanId())
    setPasteText("")
    setOpen(false)
  }

  function handlePasteImport() {
    if (!pasteResult || pasteResult.drafts.length === 0) return
    let resets = 0
    for (const draft of pasteResult.drafts) {
      const account = addAccount(draft.input)
      for (const reset of draft.resets) {
        logEvent(account.id, {
          type: "reset",
          date: reset.date,
          cost: reset.cost,
        })
        resets++
      }
    }
    toast.success(
      `Imported ${pasteResult.drafts.length} ${pasteResult.drafts.length === 1 ? "account" : "accounts"}${resets > 0 ? ` and ${resets} resets` : ""} from pasted orders.`
    )
    resetAndClose()
  }

  function handleManualSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = parseAccountInput({
      firm: form.firm,
      nickname:
        form.nickname.trim() !== ""
          ? form.nickname
          : selectedPlan
            ? `${form.firm} ${selectedPlan.programName}`
            : "",
      externalId: form.externalId,
      accountSize: form.accountSize,
      programType: form.programType,
      startDate: form.startDate,
      currency: form.currency,
      listPrice: form.listPrice,
      discountCode: form.discountCode,
      discount: form.discount,
      refundable: form.refundable,
      refundCondition: form.refundCondition,
      recurringFee: form.recurringFee,
      recurringCadence:
        (Number(form.recurringFee) || 0) > 0 ? form.recurringCadence : "none",
      addons: form.addons.filter((a) => a.name.trim() !== ""),
      rules: form.rules,
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    const account = addAccount(result.data)
    toast.success(`Added ${account.nickname} — eval fee logged.`)
    resetAndClose()
  }

  async function importFiles(files: FileList | File[]) {
    const file = Array.from(files)[0]
    if (!file) return
    const { accounts, errors } = await parseAccountFile(file)
    for (const input of accounts) {
      addAccount(input)
    }
    if (accounts.length > 0) {
      toast.success(
        `Imported ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"} from ${file.name}.`
      )
    }
    if (errors.length > 0) {
      toast.error(errors.slice(0, 3).join(" · "))
    }
    if (accounts.length > 0 && errors.length === 0) {
      resetAndClose()
    }
  }

  const amountPaid = Math.max(
    (Number(form.listPrice) || 0) - (Number(form.discount) || 0),
    0
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setDragging(false)
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Add account
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add account</DialogTitle>
          <DialogDescription>
            Pick a firm and plan — pricing and rules autofill from the firm’s
            published terms. Creating the account logs its eval fee as the first
            transaction.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="manual" className="gap-4">
          <TabsList className="w-full">
            <TabsTrigger value="manual">Fill out manually</TabsTrigger>
            <TabsTrigger value="import">Import file</TabsTrigger>
            <TabsTrigger value="paste">Paste orders</TabsTrigger>
          </TabsList>
          <TabsContent value="paste">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="acct-paste">
                  Paste your order history
                </FieldLabel>
                <Textarea
                  id="acct-paste"
                  rows={9}
                  className="font-mono text-xs"
                  placeholder={`Order #\tDate\tProducts\tTotal\tPayment\tStatus\n#6307059\tJul 5, 2026\tLucidFlex 50K NT_TDV\t$70.00\tCredit Card\tcompleted`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                <FieldDescription>
                  Copy the order table straight from your firm&apos;s
                  dashboard. Products are matched against the plan catalog;
                  &quot;Reset&quot; rows attach as reset events to the matching
                  account.
                </FieldDescription>
              </Field>
              {pasteResult && (
                <div className="flex flex-col gap-1.5 text-sm">
                  <span className="font-medium">
                    {pasteResult.drafts.length}{" "}
                    {pasteResult.drafts.length === 1 ? "account" : "accounts"}{" "}
                    · {pasteResult.resetCount}{" "}
                    {pasteResult.resetCount === 1 ? "reset" : "resets"} ready
                    to import
                  </span>
                  {pasteResult.skipped.slice(0, 3).map((note) => (
                    <span key={note} className="text-destructive">
                      {note}
                    </span>
                  ))}
                  {pasteResult.skipped.length > 3 && (
                    <span className="text-muted-foreground">
                      +{pasteResult.skipped.length - 3} more lines skipped
                    </span>
                  )}
                </div>
              )}
            </FieldGroup>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!pasteResult || pasteResult.drafts.length === 0}
                onClick={handlePasteImport}
              >
                Import{" "}
                {pasteResult && pasteResult.drafts.length > 0
                  ? `${pasteResult.drafts.length} ${pasteResult.drafts.length === 1 ? "account" : "accounts"}`
                  : "accounts"}
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="import">
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop a CSV or JSON file, or browse"
              className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-6 text-center transition-colors ${
                dragging ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragging(false)
                void importFiles(e.dataTransfer.files)
              }}
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                {dragging ? (
                  <FileUpIcon className="size-5 text-primary" />
                ) : (
                  <UploadIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  Drag & drop a CSV or JSON file
                </span>
                <span className="text-sm text-muted-foreground">
                  or click to browse
                </span>
              </div>
              <p className="max-w-sm text-xs text-muted-foreground">
                Same validation as the form. Required fields: firm, nickname,
                accountSize, programType, startDate, listPrice. Optional:
                discount, refundable, recurringFee, addons, rules.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,application/json,text/csv"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) void importFiles(e.target.files)
                e.target.value = ""
              }}
            />
          </TabsContent>
          <TabsContent value="manual">
            <form onSubmit={handleManualSubmit}>
              <FieldGroup>
                <FieldSet>
                  <FieldLegend>Identity</FieldLegend>
                  <FieldGroup>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="acct-firm">Firm</FieldLabel>
                        <Select
                          value={form.firm}
                          onValueChange={(value) => {
                            if (value) selectFirm(value as Firm)
                          }}
                          items={FIRMS.map((firm) => ({
                            label: firm,
                            value: firm,
                          }))}
                        >
                          <SelectTrigger id="acct-firm" className="w-full">
                            <SelectValue placeholder="Select a firm" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {FIRMS.map((firm) => (
                                <SelectItem key={firm} value={firm}>
                                  {firm}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-size">
                          Account size
                        </FieldLabel>
                        <Select
                          value={form.accountSize}
                          onValueChange={(value) => {
                            if (value) selectSize(value)
                          }}
                          items={sizeOptions.map((size) => ({
                            label: formatCurrency(size),
                            value: String(size),
                          }))}
                        >
                          <SelectTrigger id="acct-size" className="w-full">
                            <SelectValue placeholder="Select a size" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {sizeOptions.map((size) => (
                                <SelectItem key={size} value={String(size)}>
                                  {formatCurrency(size)}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldDescription>
                          Only sizes {form.firm} actually sells.
                        </FieldDescription>
                      </Field>
                    </div>
                    {sizePlans.length > 1 && (
                      <Field>
                        <FieldLabel htmlFor="acct-plan">Plan</FieldLabel>
                        <Select
                          value={planId}
                          onValueChange={(value) => {
                            if (value) applyPlan(planById(value))
                          }}
                          items={sizePlans.map((plan) => ({
                            label: plan.programName,
                            value: plan.id,
                          }))}
                        >
                          <SelectTrigger id="acct-plan" className="w-full">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {sizePlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.programName}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    )}
                    {selectedPlan && (
                      <FieldDescription>
                        {selectedPlan.programName}:{" "}
                        {formatCurrency(selectedPlan.listPrice)}
                        {selectedPlan.billing === "monthly" ? "/mo" : ""}
                        {selectedPlan.activationFee > 0 &&
                          ` · ${formatCurrency(selectedPlan.activationFee)} activation on funding`}
                        {selectedPlan.fundedMonthlyFee > 0 &&
                          ` · ${formatCurrency(selectedPlan.fundedMonthlyFee)}/mo once funded`}
                        {selectedPlan.resetFee > 0 &&
                          ` · ${formatCurrency(selectedPlan.resetFee)} reset`}
                      </FieldDescription>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="acct-nickname">
                          Nickname
                        </FieldLabel>
                        <Input
                          id="acct-nickname"
                          placeholder={
                            selectedPlan
                              ? `${form.firm} ${selectedPlan.programName}`
                              : `${form.firm} ${Number(form.accountSize) / 1000}K`
                          }
                          value={form.nickname}
                          onChange={(e) => patch({ nickname: e.target.value })}
                        />
                        <FieldDescription>
                          Defaults to the plan name if left blank.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-external">
                          Account ID
                        </FieldLabel>
                        <Input
                          id="acct-external"
                          placeholder="e.g. LT-2843917"
                          value={form.externalId}
                          onChange={(e) =>
                            patch({ externalId: e.target.value })
                          }
                        />
                        <FieldDescription>
                          Optional — the identifier the firm assigned.
                        </FieldDescription>
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel>Program type</FieldLabel>
                        <ToggleGroup
                          multiple={false}
                          variant="outline"
                          className="w-full"
                          value={[form.programType]}
                          onValueChange={(value) => {
                            if (value[0]) {
                              patch({ programType: value[0] as ProgramType })
                            }
                          }}
                        >
                          {(Object.keys(PROGRAM_LABELS) as ProgramType[]).map(
                            (program) => (
                              <ToggleGroupItem
                                key={program}
                                value={program}
                                className="flex-1"
                              >
                                {PROGRAM_LABELS[program]}
                              </ToggleGroupItem>
                            )
                          )}
                        </ToggleGroup>
                        <FieldDescription>
                          Set from the plan — override only for promo variants.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-start">
                          Purchase / start date
                        </FieldLabel>
                        <Input
                          id="acct-start"
                          type="date"
                          value={form.startDate}
                          onChange={(e) => patch({ startDate: e.target.value })}
                          required
                        />
                        <FieldDescription>
                          Anchors all time series for this account.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-currency">
                          Currency
                        </FieldLabel>
                        <Select
                          value={form.currency}
                          onValueChange={(value) => {
                            if (value) patch({ currency: value })
                          }}
                          items={CURRENCIES}
                        >
                          <SelectTrigger id="acct-currency" className="w-full">
                            <SelectValue placeholder="🇺🇸 USD" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {CURRENCIES.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </FieldGroup>
                </FieldSet>
                <FieldSet>
                  <FieldLegend>Cost terms</FieldLegend>
                  <FieldGroup>
                    <div className="grid grid-cols-3 gap-4">
                      <Field>
                        <FieldLabel htmlFor="acct-list">List price</FieldLabel>
                        <Input
                          id="acct-list"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="149"
                          value={form.listPrice}
                          onChange={(e) => patch({ listPrice: e.target.value })}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-code">
                          Discount code
                        </FieldLabel>
                        <Input
                          id="acct-code"
                          placeholder="JULY50"
                          value={form.discountCode}
                          onChange={(e) =>
                            patch({ discountCode: e.target.value })
                          }
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-discount">
                          Discount amount
                        </FieldLabel>
                        <Input
                          id="acct-discount"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={form.discount}
                          onChange={(e) => patch({ discount: e.target.value })}
                        />
                      </Field>
                    </div>
                    <FieldDescription>
                      Effective spend: {formatCurrency(amountPaid)}
                    </FieldDescription>
                    <div className="grid grid-cols-2 gap-4">
                      <Field orientation="horizontal">
                        <Checkbox
                          id="acct-refundable"
                          checked={form.refundable}
                          onCheckedChange={(checked) =>
                            patch({ refundable: !!checked })
                          }
                        />
                        <FieldLabel htmlFor="acct-refundable">
                          Fee is refundable
                        </FieldLabel>
                      </Field>
                      {form.refundable && (
                        <Field>
                          <FieldLabel htmlFor="acct-refund-cond">
                            Refund condition
                          </FieldLabel>
                          <Input
                            id="acct-refund-cond"
                            placeholder="Returned on first payout"
                            value={form.refundCondition}
                            onChange={(e) =>
                              patch({ refundCondition: e.target.value })
                            }
                          />
                        </Field>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Field>
                        <FieldLabel htmlFor="acct-recurring">
                          Recurring fee
                        </FieldLabel>
                        <Input
                          id="acct-recurring"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0"
                          value={form.recurringFee}
                          onChange={(e) =>
                            patch({ recurringFee: e.target.value })
                          }
                        />
                        <FieldDescription>
                          Accrues automatically — each elapsed month becomes a
                          transaction.
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="acct-cadence">Cadence</FieldLabel>
                        <Select
                          value={form.recurringCadence}
                          onValueChange={(value) => {
                            if (value) {
                              patch({
                                recurringCadence: value as "none" | "monthly",
                              })
                            }
                          }}
                          items={[
                            { label: "None", value: "none" },
                            { label: "Monthly", value: "monthly" },
                          ]}
                        >
                          <SelectTrigger id="acct-cadence" className="w-full">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field>
                      <FieldLabel>Add-ons bought</FieldLabel>
                      {form.addons.map((addon, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            aria-label={`Add-on ${index + 1} name`}
                            placeholder="Higher split"
                            value={addon.name}
                            onChange={(e) =>
                              patch({
                                addons: form.addons.map((a, i) =>
                                  i === index
                                    ? { ...a, name: e.target.value }
                                    : a
                                ),
                              })
                            }
                          />
                          <Input
                            aria-label={`Add-on ${index + 1} cost`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Cost"
                            className="w-28"
                            value={addon.cost}
                            onChange={(e) =>
                              patch({
                                addons: form.addons.map((a, i) =>
                                  i === index
                                    ? { ...a, cost: e.target.value }
                                    : a
                                ),
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              patch({
                                addons: form.addons.filter(
                                  (_, i) => i !== index
                                ),
                              })
                            }
                          >
                            <XIcon />
                            <span className="sr-only">Remove add-on</span>
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-fit"
                        onClick={() =>
                          patch({
                            addons: [...form.addons, { name: "", cost: "" }],
                          })
                        }
                      >
                        <PlusIcon data-icon="inline-start" />
                        Add add-on
                      </Button>
                    </Field>
                  </FieldGroup>
                </FieldSet>
                <FieldSet>
                  <FieldLegend>Rules</FieldLegend>
                  <FieldDescription>
                    {selectedPlan
                      ? `Autofilled from ${selectedPlan.programName} — override only if a promo changed terms.`
                      : `Defaults for ${form.firm} — override if your terms differ.`}{" "}
                    These feed the firm radar.
                  </FieldDescription>
                  <FieldGroup>
                    <div className="grid grid-cols-2 gap-4 @sm:grid-cols-3">
                      {RULE_FIELDS.map(({ key, label }) => (
                        <Field key={key}>
                          <FieldLabel htmlFor={`acct-rule-${key}`}>
                            {label}
                          </FieldLabel>
                          <Input
                            id={`acct-rule-${key}`}
                            type="number"
                            min="0"
                            step="0.1"
                            value={form.rules[key]}
                            onChange={(e) =>
                              patch({
                                rules: {
                                  ...form.rules,
                                  [key]: Number(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </Field>
                      ))}
                    </div>
                  </FieldGroup>
                </FieldSet>
              </FieldGroup>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create account</Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
