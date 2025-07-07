"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
  FilterFn,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAllProperties } from "@/lib/actions/property.action"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "./ui/badge"

// Property Type
type Property = {
  id: string
  name: string
  dept_user: string
  UoM: string
  quantity: number
  category: string
  initial_price: number
}

// Price filter logic
const betweenFilter: FilterFn<Property> = (row, columnId, value) => {
  const val = row.getValue<number>(columnId)
  const { min, max } = value || {}
  if (min != null && max != null) return val >= min && val <= max
  if (min != null) return val >= min
  if (max != null) return val <= max
  return true
}

export default function AllPropertyList() {
  const [data, setData] = React.useState<Property[]>([])
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("")
  const [deptFilter, setDeptFilter] = React.useState("")
  const [minPrice, setMinPrice] = React.useState<string | number>("")
  const [maxPrice, setMaxPrice] = React.useState<string | number>("")

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  React.useEffect(() => {
    getAllProperties({ limit: 100, page: 1 }).then(res => setData(res.property))
  }, [])

  const columns: ColumnDef<Property>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "UoM", header: "UoM" },
    { accessorKey: "quantity", header: "Qty" },
    {
        accessorKey: "category",
        header: () => <div>Category</div>,
        cell: (info) => {
            const category = info.getValue<string>()

            // Define your variant map
            const variantMap: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
            Electronics: "secondary",
            Furniture: "default",
            Stationery: "outline",
            Others: "destructive",
            }
            
            const variant = variantMap[category] ?? "outline"
            
            return (
            <Badge variant={variant}>
                {category}
            </Badge>
            )
        },
    },  
    {
        accessorKey: "initial_price",
        header: () => <div className="text-right">Initial Price</div>,
        cell: info => {
            const value = info.getValue<number>();
            const formatted = typeof value === "number" ? `$${value.toFixed(2)}` : "N/A";
            return <div className="text-right font-medium">{formatted}</div>;
        },
        
      filterFn: betweenFilter,
    },
    {
        id: "total_price",
        header: () => <div className="text-right">Total Price</div>,
        cell: (info) => {
            const row = info.row.original
            const total = row.quantity * row.initial_price
            return (
                <div className="text-right font-semibold">
                ${total.toFixed(2)}
            </div>
            )
        },
    },
    { accessorKey: "dept_user", header: "Department" },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.original.id)}>
              Copy ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  React.useEffect(() => {
    table.getColumn("name")?.setFilterValue(search || undefined)
    table.getColumn("category")?.setFilterValue(categoryFilter || undefined)
    table.getColumn("dept_user")?.setFilterValue(deptFilter || undefined)
  }, [search, categoryFilter, deptFilter, table])

  React.useEffect(() => {
    table.getColumn("initial_price")?.setFilterValue({
      min: minPrice === "" ? undefined : minPrice,
      max: maxPrice === "" ? undefined : maxPrice,
    })
  }, [minPrice, maxPrice, table])

  const categories = Array.from(new Set(data.map(p => p.category)))
  const departments = Array.from(new Set(data.map(p => p.dept_user)))

  const resetFilters = () => {
    setSearch("")
    setCategoryFilter("")
    setDeptFilter("")
    setMinPrice("")
    setMaxPrice("")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <Input placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} className="w-48" />

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
          </SelectContent>
        </Select>

        <Input placeholder="Min" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-24" />
        <Input placeholder="Max" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))} className="w-24" />

        <Button variant="secondary" onClick={resetFilters}>Reset Filters</Button>
      </div>

      <div className="rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                <TableHead className="bg-muted text-muted-foreground px-4 py-2 justify-center">No</TableHead>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} className="bg-muted text-muted-foreground px-4 py-2">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, i) => (
                <TableRow key={row.id} className="hover:bg-card">
                  <TableCell className="text-center align-middle w-12">{i + 1}</TableCell>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="px-4 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center py-4">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} result(s)
        </span>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
