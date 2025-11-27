import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type OnChangeFn,
    type PaginationState,
    type SortingState,
    type VisibilityState,
} from '@tanstack/react-table';
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Pin,
    PinOff,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    pagination?: {
        pageIndex: number;
        pageSize: number;
        total: number;
        onPaginationChange: OnChangeFn<PaginationState>;
    };
    onRowClick?: (row: TData) => void;
    loading?: boolean;
    enableColumnFilters?: boolean;
    enableSorting?: boolean;
    enablePinning?: boolean;
}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             pagination,
                                             onRowClick,
                                             loading = false,
                                             enableColumnFilters = true,
                                             enableSorting = true,
                                             enablePinning = true,
                                         }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnPinning, setColumnPinning] = useState({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: pagination ? undefined : getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onColumnPinningChange: setColumnPinning,
        manualPagination: !!pagination,
        pageCount: pagination ? Math.ceil(pagination.total / pagination.pageSize) : undefined,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            columnPinning,
            pagination: pagination
                ? {
                    pageIndex: pagination.pageIndex,
                    pageSize: pagination.pageSize,
                }
                : undefined,
        },
        onPaginationChange: pagination?.onPaginationChange,
    });

    const toggleColumnPin = (columnId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const current = table.getState().columnPinning;
        const isPinned = current.left?.includes(columnId);

        setColumnPinning({
            left: isPinned
                ? current.left?.filter((id) => id !== columnId)
                : [...(current.left || []), columnId],
        });
    };

    return (
        <div className="w-full space-y-4">
            {/* Table Container - Uses Theme Card Colors */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted">
                    <table className="w-full border-collapse text-sm">
                        {/* Header */}
                        <thead className="bg-muted/40 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const isPinned = table.getState().columnPinning.left?.includes(header.column.id);

                                    return (
                                        <th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            className={`group relative border-b border-border px-6 py-4 text-left transition-colors ${
                                                isPinned ? 'sticky left-0 z-20 bg-card shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border' : ''
                                            }`}
                                            style={{ minWidth: header.column.columnDef.minSize }}
                                        >
                                            {header.isPlaceholder ? null : (
                                                <div className="space-y-3">
                                                    {/* Header Title & Actions */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div
                                                            className={`flex items-center gap-2 ${
                                                                header.column.getCanSort() && enableSorting
                                                                    ? 'cursor-pointer select-none hover:text-foreground'
                                                                    : ''
                                                            }`}
                                                            onClick={header.column.getToggleSortingHandler()}
                                                        >
                                                            {flexRender(header.column.columnDef.header, header.getContext())}

                                                            {/* Sort Icons */}
                                                            {enableSorting && header.column.getCanSort() && (
                                                                <span className="flex flex-col opacity-0 transition-opacity group-hover:opacity-50 aria-[current=true]:text-primary aria-[current=true]:opacity-100"
                                                                      aria-current={header.column.getIsSorted() ? 'true' : 'false'}>
                                                                        {header.column.getIsSorted() === 'asc' ? (
                                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                                        ) : header.column.getIsSorted() === 'desc' ? (
                                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                                        ) : (
                                                                            <ChevronsUpDown className="h-3.5 w-3.5" />
                                                                        )}
                                                                    </span>
                                                            )}
                                                        </div>

                                                        {/* Pin Button - Only visible on group hover */}
                                                        {enablePinning && (
                                                            <button
                                                                onClick={(e) => toggleColumnPin(header.column.id, e)}
                                                                className={`rounded p-1 transition-all hover:bg-muted ${
                                                                    isPinned ? 'text-primary opacity-100' : 'text-muted-foreground opacity-0 group-hover:opacity-100'
                                                                }`}
                                                                title={isPinned ? 'Unpin column' : 'Pin column'}
                                                            >
                                                                {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Modern Input Filter */}
                                                    {header.column.getCanFilter() && enableColumnFilters && (
                                                        <div className="relative">
                                                            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                            <input
                                                                type="text"
                                                                value={(header.column.getFilterValue() as string) ?? ''}
                                                                onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                                placeholder="Filter..."
                                                                className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                        </thead>

                        {/* Body */}
                        <tbody className="divide-y divide-border bg-card">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-xs font-medium">Loading data...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={`group transition-colors hover:bg-muted/50 ${
                                        onRowClick ? 'cursor-pointer' : ''
                                    }`}
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map((cell) => {
                                        const isPinned = table.getState().columnPinning.left?.includes(cell.column.id);

                                        return (
                                            <td
                                                key={cell.id}
                                                className={`whitespace-nowrap px-6 py-4 text-foreground ${
                                                    isPinned ? 'sticky left-0 z-10 bg-card group-hover:bg-muted/50 after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border' : ''
                                                }`}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">No results found</p>
                                        <p className="text-xs opacity-60">Try adjusting your filters</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {(pagination || (!pagination && table.getPageCount() > 1)) && (
                <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:px-6">
                    <div className="text-xs text-muted-foreground">
                        {pagination ? (
                            <>
                                Showing <span className="font-medium text-foreground">{pagination.pageIndex * pagination.pageSize + 1}</span> to{' '}
                                <span className="font-medium text-foreground">
                                    {Math.min((pagination.pageIndex + 1) * pagination.pageSize, pagination.total)}
                                </span>{' '}
                                of <span className="font-medium text-foreground">{pagination.total}</span> entries
                            </>
                        ) : (
                            <>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                            Previous
                        </button>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
