"use client";

import {
  type LegacyColumnDef as ColumnDef,
  useLegacyTable as useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table/legacy";
import { flexRender } from "@tanstack/react-table";
import type { PaginationState, SortingState } from "@tanstack/react-table";
type VisibilityState = Record<string, boolean>;
import { useState, useMemo, useEffect } from "react";
import {
  Loader2,
  FolderSearch,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Columns,
  Trash2,
  MoreHorizontal,
  Edit,
  Copy,
  X,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { TableFilterPopover } from "./TableFilterPopover";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "./ConfirmModal";
import { cn } from "@/lib/utils";

export interface AdminTableProps<TData extends Record<string, any>> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  getRowId: (row: TData) => string;
  isLoading?: boolean;

  pageCount?: number;
  totalItems?: number;
  pageIndex?: number;
  pageSize?: number;
  onPaginationChange?: (pagination: PaginationState) => void;
  enablePagination?: boolean;

  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  toolbarActions?: React.ReactNode;

  onAddAction?: () => void;
  addLabel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;

  filterContent?: React.ReactNode;
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  onApplyFilters?: () => void;
  filterTitle?: string;

  enableColumnToggle?: boolean;
  enableRowSelection?: boolean;
  enableSerialNumber?: boolean;

  onDeleteSelected?: (selectedIds: string[]) => void;
  isDeleting?: boolean;
  deleteTitle?: string;
  deleteDescription?: (count: number) => string;

  onEditAction?: (row: TData) => void;
  onDuplicateAction?: (row: TData) => void;
  onDeleteAction?: (row: TData) => void;
  renderRowActions?: (row: TData) => React.ReactNode;
  renderBulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;

  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  hideToolbar?: boolean;
}

export function AdminTable<TData extends Record<string, any>>({
  data,
  columns,
  getRowId,
  isLoading,
  pageCount = 0,
  totalItems = 0,
  pageIndex = 0,
  pageSize = 20,
  onPaginationChange,
  enablePagination = true,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  onSearchSubmit,
  toolbarActions,
  onAddAction,
  addLabel,
  onRefresh,
  isRefreshing = false,
  filterContent,
  activeFiltersCount = 0,
  onResetFilters,
  onApplyFilters,
  filterTitle = "Filters",
  enableColumnToggle = true,
  hideToolbar = false,
  enableRowSelection = true,
  enableSerialNumber = true,
  onDeleteSelected,
  isDeleting = false,
  deleteTitle = "Delete Records",
  deleteDescription,
  onEditAction,
  onDuplicateAction,
  onDeleteAction,
  renderRowActions,
  renderBulkActions,
  emptyStateIcon = <FolderSearch className="w-10 h-10 text-muted-foreground/60" />,
  emptyStateTitle = "No Data Found",
  emptyStateDescription = "There are no records to display.",
  emptyStateAction,
}: AdminTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const selectedIds = useMemo(() => {
    return Object.keys(rowSelection).filter(
      (key) => (rowSelection as any)[key]
    );
  }, [rowSelection]);

  useEffect(() => {
    setRowSelection({});
  }, [pageIndex, data]);

  const confirmBulkDelete = () => {
    if (onDeleteSelected) {
      onDeleteSelected(selectedIds);
    }
  };

  useEffect(() => {
    if (!isDeleting && isDeleteDialogOpen) {
      setIsDeleteDialogOpen(false);
      setRowSelection({});
    }
  }, [isDeleting]);

  const finalColumns = useMemo(() => {
    const cols: ColumnDef<TData, any>[] = [...columns];

    if (enableRowSelection) {
      cols.unshift({
        id: "select",
        size: 40,
        header: () => {
          const isAllSelected =
            data.length > 0 && selectedIds.length === data.length;
          return (
            <Checkbox
              aria-label="Select all rows"
              checked={isAllSelected}
              onCheckedChange={(value) => {
                if (value) {
                  const all: Record<string, boolean> = {};
                  data.forEach((d) => {
                    all[getRowId(d)] = true;
                  });
                  setRowSelection(all);
                } else {
                  setRowSelection({});
                }
              }}
            />
          );
        },
        cell: ({ row }: any) => {
          const rowId = getRowId(row.original);
          const isSelected = Boolean((rowSelection as any)[rowId]);
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                aria-label="Select row"
                checked={isSelected}
                onCheckedChange={(value) => {
                  setRowSelection((prev: any) => ({
                    ...prev,
                    [rowId]: Boolean(value),
                  }));
                }}
              />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      });
    }

    if (enableSerialNumber) {
      cols.splice(enableRowSelection ? 1 : 0, 0, {
        id: "serial",
        header: "Sr.",
        size: 50,
        enableHiding: false,
        cell: ({ row }: any) => {
          let index = row.index + 1;
          if (enablePagination) {
            index += pageIndex * pageSize;
          }
          return String(index).padStart(2, "0");
        },
      });
    }

    if (
      onEditAction ||
      onDuplicateAction ||
      onDeleteAction ||
      renderRowActions
    ) {
      cols.push({
        id: "actions",
        header: "Action",
        size: 50,
        enableHiding: false,
        cell: ({ row }: any) => (
          <div
            className="flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {renderRowActions ? (
              renderRowActions(row.original)
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121316] border border-border text-white shadow-lg">
                  {onEditAction && (
                    <DropdownMenuItem
                      onClick={() => onEditAction(row.original)}
                      className="cursor-pointer hover:bg-zinc-800"
                    >
                      <Edit className="mr-2 h-4 w-4 text-muted-foreground" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onDuplicateAction && (
                    <DropdownMenuItem
                      onClick={() => onDuplicateAction(row.original)}
                      className="cursor-pointer hover:bg-zinc-800"
                    >
                      <Copy className="mr-2 h-4 w-4 text-emerald-400" />
                      Duplicate
                    </DropdownMenuItem>
                  )}
                  {onDeleteAction && (
                    <DropdownMenuItem
                      onClick={() => onDeleteAction(row.original)}
                      className="cursor-pointer text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ),
      });
    }

    return cols;
  }, [
    columns,
    enableRowSelection,
    renderRowActions,
    enableSerialNumber,
    enablePagination,
    onEditAction,
    onDuplicateAction,
    onDeleteAction,
    data,
    selectedIds,
    rowSelection,
    pageIndex,
    pageSize,
    getRowId,
  ]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    getRowId,
    pageCount: enablePagination ? pageCount : undefined,
    state: {
      pagination: enablePagination ? { pageIndex, pageSize } : undefined,
      sorting,
      columnVisibility,
    },
    manualPagination: enablePagination,
    enableSortingRemoval: false,
    onPaginationChange: (updater: any) => {
      if (onPaginationChange && enablePagination) {
        if (typeof updater === "function") {
          onPaginationChange(updater({ pageIndex, pageSize }));
        } else {
          onPaginationChange(updater);
        }
      }
    },
    onSortingChange: setSorting as any,
    onColumnVisibilityChange: setColumnVisibility as any,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Search and Toolbar */}
      {!hideToolbar && (
        <div className="flex flex-wrap items-center justify-start gap-2">
          {/* 1. Search */}
          {onSearchSubmit && onSearchChange && (
            <form onSubmit={onSearchSubmit} className="w-56 shrink-0">
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-black/40 border-border text-white text-xs h-9 w-full"
              />
            </form>
          )}

          {/* 2. Add Button */}
          {onAddAction && (
            <Button
              size="icon"
              onClick={onAddAction}
              title={addLabel || "Add"}
              className="w-9 h-9 p-0 shrink-0 bg-white text-black hover:bg-zinc-200"
            >
              <Plus className="w-4 h-4" />
              <span className="sr-only">{addLabel || "Add"}</span>
            </Button>
          )}

          {/* 3. Refresh Button */}
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              title="Refresh"
              className="shrink-0 bg-black/40 border-border h-9 w-9 text-muted-foreground hover:text-white"
            >
              <RefreshCcw
                className={cn("w-4 h-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}

          {/* 4. Columns Toggle */}
          {enableColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  title="Toggle Columns"
                  className="w-9 h-9 p-0 border-border bg-black/40 text-muted-foreground hover:text-white shrink-0"
                  disabled={data.length === 0 || isLoading}
                >
                  <Columns className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-[#121316] border border-border text-white shadow-lg">
                {table
                  .getAllColumns()
                  .filter((column: any) => column.getCanHide())
                  .map((column: any) => {
                    const title = column.id.replace(/_/g, " ");
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize text-xs cursor-pointer hover:bg-zinc-800"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                        onSelect={(e) => e.preventDefault()}
                      >
                        {title}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* 5. Filters Popover */}
          {filterContent && (
            <TableFilterPopover
              title={filterTitle}
              activeCount={activeFiltersCount}
              onReset={onResetFilters}
              onApply={onApplyFilters}
            >
              {filterContent}
            </TableFilterPopover>
          )}

          {/* 6. Extra custom actions (e.g. Export) */}
          {toolbarActions}
        </div>
      )}

      {/* Main Table or Loading / Empty */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-[#121316] border border-border/60 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground font-medium">Loading...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-[#121316] border border-border/60 rounded-xl">
          <div className="mb-3 opacity-60">{emptyStateIcon}</div>
          <p className="text-sm font-medium text-white">{emptyStateTitle}</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {emptyStateDescription}
          </p>
          {emptyStateAction && <div className="mt-4">{emptyStateAction}</div>}
        </div>
      ) : (
        <div className="w-full bg-[#121316] border border-border/60 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="w-full overflow-x-auto no-scrollbar">
            <Table className="w-full min-w-full table-fixed border-collapse">
              <TableHeader className="bg-black/30 border-b border-border/60">
                {table.getHeaderGroups().map((headerGroup: any) => (
                  <TableRow
                    className="hover:bg-transparent border-b border-border/40"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header: any) => {
                      const columnSize = header.column.getSize();
                      return (
                        <TableHead
                          key={header.id}
                          className={cn(
                            "border-r border-border/30 last:border-r-0 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap",
                            (header.column.columnDef.meta as any)?.className
                          )}
                          style={
                            columnSize
                              ? {
                                  width: `${columnSize}px`,
                                  minWidth: `${columnSize}px`,
                                  maxWidth: `${columnSize}px`,
                                }
                              : undefined
                          }
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <div
                              className="flex h-full cursor-pointer select-none items-center gap-1.5 overflow-hidden"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <span className="truncate">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </span>
                              {{
                                asc: (
                                  <ChevronUpIcon className="size-3.5 shrink-0 opacity-80" />
                                ),
                                desc: (
                                  <ChevronDownIcon className="size-3.5 shrink-0 opacity-80" />
                                ),
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          ) : (
                            <span className="truncate">
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                          )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row: any) => {
                  const rowId = getRowId(row.original);
                  const isSelected = Boolean(rowSelection[rowId]);
                  return (
                    <TableRow
                      data-state={isSelected ? "selected" : undefined}
                      key={row.id}
                      onClick={() => {
                        if (enableRowSelection) {
                          setRowSelection((prev) => ({
                            ...prev,
                            [rowId]: !prev[rowId],
                          }));
                        }
                      }}
                      className={cn(
                        "cursor-pointer hover:bg-white/[0.02] border-b border-border/30 last:border-b-0 transition-colors",
                        isSelected && "bg-white/[0.04]"
                      )}
                    >
                      {row.getVisibleCells().map((cell: any) => {
                        const columnSize = cell.column.getSize();
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "border-r border-border/30 last:border-r-0 py-3 px-3 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap",
                              (cell.column.columnDef.meta as any)?.className
                            )}
                            style={
                              columnSize
                                ? {
                                    width: `${columnSize}px`,
                                    minWidth: `${columnSize}px`,
                                    maxWidth: `${columnSize}px`,
                                  }
                                : undefined
                            }
                          >
                            <div className="w-full min-w-0 overflow-hidden text-ellipsis">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      {enablePagination && !isLoading && data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            <p>Viewing</p>
            <Select
              value={String(pageIndex + 1)}
              onValueChange={(value) => {
                if (onPaginationChange) {
                  onPaginationChange({
                    pageIndex: Number(value) - 1,
                    pageSize,
                  });
                }
              }}
            >
              <SelectTrigger
                aria-label="Select result range"
                className="w-fit min-w-none bg-black/40 border-border h-7 text-xs"
              >
                <SelectValue placeholder="1-20" />
              </SelectTrigger>
              <SelectContent className="bg-[#121316] border border-border text-white">
                {Array.from({ length: Math.max(1, pageCount) }, (_, i) => {
                  const start = i * pageSize + 1;
                  const end = Math.min((i + 1) * pageSize, totalItems || (i + 1) * pageSize);
                  const pageNum = i + 1;
                  return (
                    <SelectItem key={pageNum} value={String(pageNum)} className="text-xs">
                      {`${start}-${end}`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <p>
              of <strong className="font-medium text-white">{totalItems}</strong> results
            </p>
          </div>

          <Pagination className="justify-center sm:justify-end w-full sm:w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  disabled={pageIndex <= 0}
                  onClick={() => {
                    if (onPaginationChange) {
                      onPaginationChange({
                        pageIndex: Math.max(0, pageIndex - 1),
                        pageSize,
                      });
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="h-8 border-border bg-black/40 text-xs gap-1"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>
              </PaginationItem>
              <PaginationItem>
                <Button
                  disabled={pageIndex >= pageCount - 1}
                  onClick={() => {
                    if (onPaginationChange) {
                      onPaginationChange({
                        pageIndex: pageIndex + 1,
                        pageSize,
                      });
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="h-8 border-border bg-black/40 text-xs gap-1 ml-1"
                >
                  <span>Next</span>
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Floating Bulk Action Pill Toolbar */}
      {enableRowSelection && selectedIds.length > 0 && (renderBulkActions || onDeleteSelected) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-[#121316] text-white shadow-2xl border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 max-w-[90vw] overflow-x-auto whitespace-nowrap">
            <span className="text-xs font-semibold border-r border-border pr-3 mr-1 text-white">
              {selectedIds.length} selected
            </span>

            {renderBulkActions && renderBulkActions(selectedIds, () => setRowSelection({}))}

            {onDeleteSelected && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-7 text-xs rounded-full px-3 ml-1"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Delete
              </Button>
            )}

            <div className="w-px h-4 bg-border/60 mx-1" />

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-muted-foreground hover:text-white"
              onClick={() => setRowSelection({})}
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {enableRowSelection && onDeleteSelected && (
        <ConfirmModal
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmBulkDelete}
          title={deleteTitle}
          description={
            deleteDescription
              ? deleteDescription(selectedIds.length)
              : `Are you sure you want to delete ${selectedIds.length} selected record(s)? This action cannot be undone.`
          }
          isPending={isDeleting}
          isDestructive
        />
      )}
    </div>
  );
}
