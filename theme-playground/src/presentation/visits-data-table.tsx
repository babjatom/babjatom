import { useId, useMemo, useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, GripVertical, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { mockVisits, type VisitRow } from './mock-visits'

function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({ id })

  return (
    <Button
      type="button"
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="h-7 w-7 cursor-grab text-muted-foreground hover:bg-transparent active:cursor-grabbing"
    >
      <GripVertical className="h-4 w-4" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

function DraggableRow({ row }: { row: Row<VisitRow> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className={cn(
        'relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

const columns: ColumnDef<VisitRow>[] = [
  {
    id: 'drag',
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
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
    accessorKey: 'ipAddress',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        IP Address
        <ArrowUpDown className="h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.ipAddress}</span>
    ),
  },
  {
    accessorKey: 'hits',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Hits
        <ArrowUpDown className="h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{row.original.hits.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'country',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Country
        <ArrowUpDown className="h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => row.original.country,
  },
  {
    accessorKey: 'lastVisit',
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="-ml-2 h-8 px-2"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        Last visit
        <ArrowUpDown className="h-3.5 w-3.5" />
      </Button>
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.lastVisit}</span>
    ),
  },
  {
    id: 'actions',
    header: () => null,
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            aria-label="Open menu"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
            }}
          >
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={(event) => {
              event.preventDefault()
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
    enableSorting: false,
  },
]

export function VisitsDataTable() {
  const [data, setData] = useState<VisitRow[]>(() => [...mockVisits])
  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const sortableId = useId()

  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {}),
  )

  const dataIds = useMemo<UniqueIdentifier[]>(
    () => data.map((row) => row.id),
    [data],
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setData((rows) => {
      const oldIndex = dataIds.indexOf(active.id)
      const newIndex = dataIds.indexOf(over.id)
      return arrayMove(rows, oldIndex, newIndex)
    })
  }

  const selectedCount = table.getFilteredSelectedRowModel().rows.length
  const totalCount = table.getFilteredRowModel().rows.length

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                <SortableContext
                  items={dataIds}
                  strategy={verticalListSortingStrategy}
                >
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
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
        </DndContext>
      </div>
      <p className="px-1 text-sm text-muted-foreground">
        {selectedCount} of {totalCount} row(s) selected.
      </p>
    </div>
  )
}
