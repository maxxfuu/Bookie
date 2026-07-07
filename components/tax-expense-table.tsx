"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  formatCurrency,
  TAX_CATEGORY_LABELS,
  type DeductibleItem,
} from "@/lib/selectors"
import type { DeductionMode } from "@/lib/tax-treatments"
import { cn } from "@/lib/utils"
import {
  ArrowUpDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"

function SortableHeader({
  column,
  children,
  className,
}: {
  column: Column<DeductibleItem>
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDownIcon data-icon="inline-end" />
    </Button>
  )
}

/** Visual treatment of the deductible column per filing bucket. */
const DEDUCTIBLE_CELL_CLASS: Record<DeductionMode, string> = {
  active: "",
  disallowed: "line-through opacity-60",
  pending: "text-muted-foreground italic",
  info: "text-muted-foreground",
}

function buildColumns(
  onRemove: (id: string) => void,
  deductionMode: DeductionMode
): ColumnDef<DeductibleItem>[] {
  return [
    {
      accessorKey: "date",
      header: ({ column }) => (
        <SortableHeader column={column} className="-ml-3">
          Date
        </SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {new Date(`${row.original.date}T00:00:00`).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" }
          )}
        </span>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.vendor}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {TAX_CATEGORY_LABELS[row.original.category]}
        </Badge>
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <div className="flex w-full justify-end">
          <SortableHeader column={column} className="-mr-3">
            Amount
          </SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatCurrency(row.original.amount)}
        </div>
      ),
    },
    {
      accessorKey: "deductiblePct",
      header: () => <div className="text-right">Ded. %</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums text-muted-foreground">
          {row.original.deductiblePct}%
        </div>
      ),
    },
    {
      accessorKey: "deductibleValue",
      header: ({ column }) => (
        <div className="flex w-full justify-end">
          <SortableHeader column={column} className="-mr-3">
            Deductible
          </SortableHeader>
        </div>
      ),
      cell: ({ row }) => (
        <div
          className={cn(
            "text-right font-medium tabular-nums",
            DEDUCTIBLE_CELL_CLASS[deductionMode]
          )}
        >
          {formatCurrency(row.original.deductibleValue)}
        </div>
      ),
    },
    {
      accessorKey: "receiptUrl",
      header: "Receipt",
      cell: ({ row }) =>
        row.original.receiptUrl ? (
          <span className="flex items-center gap-1.5">
            <CheckIcon className="size-4 text-green-500 dark:text-green-400" />
            {row.original.receiptUrl.startsWith("data:image") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.receiptUrl}
                alt={`Receipt from ${row.original.vendor}`}
                className="size-6 rounded border object-cover"
              />
            )}
          </span>
        ) : row.original.source === "account" ? (
          <span className="text-xs text-muted-foreground">
            firm statement
          </span>
        ) : (
          <XIcon className="size-4 text-rose-500 dark:text-rose-400" />
        ),
    },
    {
      accessorKey: "source",
      header: "Source",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {row.original.source === "account" ? "Auto" : "Manual"}
        </Badge>
      ),
    },
    {
      accessorKey: "businessPurpose",
      header: "Purpose",
      cell: ({ row }) => (
        <span className="block max-w-48 truncate text-muted-foreground">
          {row.original.businessPurpose}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.source === "manual" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => onRemove(row.original.id)}
          >
            <Trash2Icon />
            <span className="sr-only">
              Remove expense from {row.original.vendor}
            </span>
          </Button>
        ) : null,
    },
  ]
}

export function TaxExpenseTable({
  items,
  onRemove,
  deductionMode,
}: {
  items: DeductibleItem[]
  onRemove: (id: string) => void
  deductionMode: DeductionMode
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const columns = React.useMemo(
    () => buildColumns(onRemove, deductionMode),
    [onRemove, deductionMode]
  )
  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No deductible items match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <span className="mr-2 text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(table.getPageCount(), 1)}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span className="sr-only">Previous page</span>
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span className="sr-only">Next page</span>
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  )
}
