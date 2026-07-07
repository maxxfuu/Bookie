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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MAX_RECEIPT_BYTES, parseExpenseInput } from "@/lib/expense-schema"
import { TAX_CATEGORY_LABELS } from "@/lib/selectors"
import { useAccounts } from "@/lib/store"
import { TAX_CATEGORIES, type TaxCategory } from "@/lib/types"
import { FileUpIcon, PlusIcon, UploadIcon, XIcon } from "lucide-react"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

type FormState = {
  date: string
  vendor: string
  amount: string
  taxCategory: TaxCategory
  deductiblePct: string
  receiptUrl: string | null
  receiptName: string
  businessPurpose: string
}

function initialForm(): FormState {
  return {
    date: todayISO(),
    vendor: "",
    amount: "",
    taxCategory: "software_data",
    deductiblePct: "100",
    receiptUrl: null,
    receiptName: "",
    businessPurpose: "",
  }
}

/** Categories that are usually mixed-use or capped — prompt a lower default. */
const PCT_SUGGESTIONS: Partial<Record<TaxCategory, string>> = {
  business_meals: "50",
  home_office: "30",
}

export function AddExpenseDialog() {
  const { addExpense } = useAccounts()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState<FormState>(initialForm)
  const [dragging, setDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const patch = (fields: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...fields }))

  function selectCategory(category: TaxCategory) {
    setForm((prev) => ({
      ...prev,
      taxCategory: category,
      // Nudge mixed-use categories off 100% unless the user already changed it.
      deductiblePct:
        prev.deductiblePct === "100" || prev.deductiblePct === ""
          ? (PCT_SUGGESTIONS[category] ?? "100")
          : prev.deductiblePct,
    }))
  }

  function attachReceipt(files: FileList | File[]) {
    const file = Array.from(files)[0]
    if (!file) return
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error(
        `Receipt is too large — keep it under ${Math.round(MAX_RECEIPT_BYTES / 1024)}KB.`
      )
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      patch({ receiptUrl: String(reader.result), receiptName: file.name })
    }
    reader.readAsDataURL(file)
  }

  function resetAndClose() {
    setForm(initialForm())
    setOpen(false)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = parseExpenseInput({
      date: form.date,
      vendor: form.vendor,
      amount: form.amount,
      taxCategory: form.taxCategory,
      deductiblePct: form.deductiblePct === "" ? 100 : form.deductiblePct,
      receiptUrl: form.receiptUrl,
      businessPurpose: form.businessPurpose,
    })
    if (!result.success) {
      toast.error(result.error)
      return
    }
    addExpense(result.data)
    toast.success(`Logged ${result.data.vendor} expense.`)
    resetAndClose()
  }

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
        Add expense
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>
            Account fees are pulled in automatically — don&apos;t re-enter
            them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="exp-date">Date</FieldLabel>
                <Input
                  id="exp-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => patch({ date: e.target.value })}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="exp-vendor">Vendor</FieldLabel>
                <Input
                  id="exp-vendor"
                  placeholder="TradingView"
                  value={form.vendor}
                  onChange={(e) => patch({ vendor: e.target.value })}
                  required
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field>
                <FieldLabel htmlFor="exp-amount">Amount</FieldLabel>
                <Input
                  id="exp-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="59.95"
                  value={form.amount}
                  onChange={(e) => patch({ amount: e.target.value })}
                  required
                />
              </Field>
              <Field className="col-span-2">
                <FieldLabel htmlFor="exp-category">Category</FieldLabel>
                <Select
                  value={form.taxCategory}
                  onValueChange={(value) => {
                    if (value) selectCategory(value as TaxCategory)
                  }}
                  items={TAX_CATEGORIES.map((c) => ({
                    label: TAX_CATEGORY_LABELS[c],
                    value: c,
                  }))}
                >
                  <SelectTrigger id="exp-category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TAX_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {TAX_CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="exp-pct">Deductible %</FieldLabel>
              <Input
                id="exp-pct"
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.deductiblePct}
                onChange={(e) => patch({ deductiblePct: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="exp-purpose">Business purpose</FieldLabel>
              <Input
                id="exp-purpose"
                placeholder="Charting subscription for futures trading"
                value={form.businessPurpose}
                onChange={(e) => patch({ businessPurpose: e.target.value })}
                required
              />
            </Field>
            <Field>
              <FieldLabel>Receipt</FieldLabel>
              {form.receiptUrl ? (
                <div className="flex items-center gap-2 rounded-lg border p-2">
                  {form.receiptUrl.startsWith("data:image") && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.receiptUrl}
                      alt="Receipt preview"
                      className="size-10 rounded border object-cover"
                    />
                  )}
                  <span className="flex-1 truncate text-sm">
                    {form.receiptName || "Attached receipt"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      patch({ receiptUrl: null, receiptName: "" })
                    }
                  >
                    <XIcon />
                    <span className="sr-only">Remove receipt</span>
                  </Button>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Drop a receipt image or PDF, or browse"
                  className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed p-4 text-center transition-colors ${
                    dragging
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
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
                    attachReceipt(e.dataTransfer.files)
                  }}
                >
                  {dragging ? (
                    <FileUpIcon className="size-5 text-primary" />
                  ) : (
                    <UploadIcon className="size-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Drag & drop or click — image/PDF, max{" "}
                    {Math.round(MAX_RECEIPT_BYTES / 1024)}KB
                  </span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) attachReceipt(e.target.files)
                  e.target.value = ""
                }}
              />
            </Field>
          </FieldGroup>
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
