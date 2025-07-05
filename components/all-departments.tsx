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
import { getAllDepartment, getAllProperties } from "@/lib/actions/property.action"
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

export default function AllDepartmentList() {
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
    getAllDepartment({ limit: 100, page: 1 }).then(res => setData(res.property))
  }, [])

  const columns: ColumnDef<Property>[] = [
    {
        accessorKey: "dept_id",
        header: () => <div>Dept CODE</div>,
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
    { accessorKey: "name", header: "Department Name" },
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

  return (
    <div className="space-y-4 flex grid-cols-3 w-auto gap-5">
      <div>

      <div className="rounded-xl border shadow-sm overflow-hidden ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                 <TableHead className="bg-muted text-muted-foreground px-4 py-2">
                    NO
                  </TableHead>
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
                <TableRow key={row.id} className="hover:bg-card text-xs font-kefa text-muted-foreground">
                  <TableCell className="p-2 font-kefa text-center align-middle w-12">{(i + 1)}</TableCell>
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
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-lg flex items-center justify-center p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
  <div className="max-w-2xl text-center">
    <blockquote className="text-lg md:text-xl italic text-zinc-100 font-serif relative">
      <span className="text-indigo-400 font-bold font-kefa">ዮሐንስ ፩:፫</span><br />
      <span className="text-zinc-300 font-kefa">
        “ሁሉ በእርሱ ሆነ፥ ከሆነውም አንዳች ስንኳ ያለ እርሱ አልሆነም።”
      </span>
    </blockquote>
    <cite className="block mt-4 text-sm text-zinc-500">— The Bible</cite>
  </div>
</div>


    </div>
  )
}
