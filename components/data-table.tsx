"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { z } from "zod"

import { PhaseBadge } from "@/components/phase-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/selectors"
import { FIRM_NAMES } from "@/lib/types"
import {
  ArrowUpDownIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  CircleCheckIcon,
  Columns3Icon,
  LoaderIcon,
} from "lucide-react"

export const schema = z.object({
  id: z.string(),
  date: z.string(),
  firm: z.enum(FIRM_NAMES),
  accountId: z.string(),
  feeType: z.enum([
    "eval",
    "reset",
    "activation",
    "addon",
    "recurring",
    "payout",
    "refund",
    "phase-change",
  ]),
  listPrice: z.number(),
  discount: z.number(),
  amountPaid: z.number(),
  phaseReached: z.enum(["phase1", "phase2", "funded", "breached"]),
  refundable: z.boolean(),
  refundStatus: z.enum(["none", "pending", "received"]),
  refundAmount: z.number(),
  payout: z.number(),
})

type TransactionRow = z.infer<typeof schema>

const feeTypeLabels: Record<TransactionRow["feeType"], string> = {
  eval: "Eval",
  reset: "Reset",
  activation: "Activation",
  addon: "Add-on",
  recurring: "Recurring",
  payout: "Payout",
  refund: "Refund",
  "phase-change": "Phase Change",
}

function SortableHeader({
  column,
  children,
  className,
}: {
  column: Column<TransactionRow>
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

function RefundBadge({ row }: { row: TransactionRow }) {
  if (!row.refundable) {
    return <span className="text-muted-foreground">—</span>
  }
  return (
    <Badge
      variant="outline"
      className="px-1.5 text-muted-foreground capitalize"
    >
      {row.refundStatus === "received" ? (
        <CircleCheckIcon className="fill-green-500 dark:fill-green-400" />
      ) : (
        <LoaderIcon />
      )}
      {row.refundStatus}
      {row.refundAmount > 0 && ` · ${formatCurrency(row.refundAmount)}`}
    </Badge>
  )
}

const columns: ColumnDef<TransactionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            table.getIsSomePageRowsSelected() &&
            !table.getIsAllPageRowsSelected()
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <SortableHeader column={column} className="-ml-3">
        Date
      </SortableHeader>
    ),
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">
        {new Date(`${row.original.date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "firm",
    header: "Firm",
    cell: ({ row }) => <span className="font-medium">{row.original.firm}</span>,
  },
  {
    accessorKey: "accountId",
    header: "Account",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.accountId}</span>
    ),
  },
  {
    accessorKey: "feeType",
    header: "Fee Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {feeTypeLabels[row.original.feeType]}
      </Badge>
    ),
  },
  {
    accessorKey: "phaseReached",
    header: "Phase",
    cell: ({ row }) => <PhaseBadge phase={row.original.phaseReached} />,
  },
  {
    accessorKey: "amountPaid",
    header: ({ column }) => (
      <div className="flex w-full justify-end">
        <SortableHeader column={column} className="-mr-3">
          Paid
        </SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right tabular-nums">
        {row.original.amountPaid > 0 ? (
          formatCurrency(row.original.amountPaid)
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "refundStatus",
    header: "Refund",
    cell: ({ row }) => <RefundBadge row={row.original} />,
  },
  {
    accessorKey: "payout",
    header: ({ column }) => (
      <div className="flex w-full justify-end">
        <SortableHeader column={column} className="-mr-3">
          Payout
        </SortableHeader>
      </div>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">
        {row.original.payout > 0 ? (
          formatCurrency(row.original.payout)
        ) : (
          <span className="font-normal text-muted-foreground">—</span>
        )}
      </div>
    ),
  },
]

export function DataTable({ data }: { data: TransactionRow[] }) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "date", desc: true },
  ])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })
  return (
    <div className="flex w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-medium">Transaction Log</h2>
          <p className="text-sm text-muted-foreground">
            Every fee, refund, and payout across all firms
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
            <Columns3Icon data-icon="inline-start" />
            Columns
            <ChevronDownIcon data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {table
              .getAllColumns()
              .filter(
                (column) =>
                  typeof column.accessorFn !== "undefined" &&
                  column.getCanHide()
              )
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
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
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
                items={[10, 20, 30, 40, 50].map((pageSize) => ({
                  label: `${pageSize}`,
                  value: `${pageSize}`,
                }))}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
