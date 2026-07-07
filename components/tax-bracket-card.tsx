"use client"

import * as React from "react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { formatCurrency } from "@/lib/selectors"
import {
  formatPct,
  stackedTaxFor,
  taxLocationById,
  TAX_LOCATIONS,
} from "@/lib/tax-rates"

export function TaxBracketCard({
  netTaxableIncome,
  payouts,
  totalDeductible,
  deductionsApplied,
  treatmentLabel,
  seTax,
  locationId,
  onLocationChange,
  year,
}: {
  netTaxableIncome: number
  payouts: number
  totalDeductible: number
  /** False when the filing treatment disallows netting deductions. */
  deductionsApplied: boolean
  treatmentLabel: string
  /** Estimated self-employment tax, or null when not applicable. */
  seTax: number | null
  locationId: string
  onLocationChange: (id: string) => void
  year: string
}) {
  const location = taxLocationById(locationId)
  const stacked = stackedTaxFor(location, netTaxableIncome)
  const federal = stacked.layers[0]
  const totalTax = stacked.total + (seTax ?? 0)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Current Tax Bracket · {year}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {formatPct(federal.marginalRate, 0)} federal
          {stacked.layers.length > 1 &&
            ` + ${stacked.layers
              .slice(1)
              .map((l) => `${formatPct(l.marginalRate)} ${l.name}`)
              .join(" + ")}`}
        </CardTitle>
        <CardAction>
          <Select
            value={locationId}
            onValueChange={(value) => {
              if (value) onLocationChange(value)
            }}
            items={TAX_LOCATIONS.map((l) => ({
              label: l.label,
              value: l.id,
            }))}
          >
            <SelectTrigger size="sm" className="w-44" aria-label="Location">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectGroup>
                {TAX_LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <p className="text-muted-foreground">{location.note}</p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Marginal {formatPct(stacked.marginalRate)}
          </Badge>
          <Badge variant="outline">
            Effective {formatPct(stacked.effectiveRate)}
          </Badge>
        </div>
        <Separator />
        <div className="flex flex-col gap-1.5 tabular-nums">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Payouts received ({year})
            </span>
            <span>{formatCurrency(payouts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {deductionsApplied
                ? "Total deductible"
                : `Deductions not applied (${treatmentLabel})`}
            </span>
            <span className={deductionsApplied ? "" : "line-through opacity-60"}>
              −{formatCurrency(totalDeductible)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Net taxable trading income</span>
            <span>{formatCurrency(netTaxableIncome)}</span>
          </div>
          <Separator className="my-1" />
          {stacked.layers.map((layer) => (
            <div key={layer.name} className="flex justify-between">
              <span className="text-muted-foreground">{layer.name}</span>
              <span>{formatCurrency(layer.tax)}</span>
            </div>
          ))}
          {seTax !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Self-employment tax
              </span>
              <span>{formatCurrency(seTax)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Total estimated tax</span>
            <span>{formatCurrency(totalTax)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
