"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  Truck,
  Download,
  Calendar,
  Plus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { AdminTable } from "@/components/shared/AdminTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

import { useAdminBulkerLogsQuery } from "@/lib/hooks/queries/useBulkerQuery";
import {
  useBulkDeleteBulkerMutation,
  useDeleteBulkerEntryMutation,
} from "@/lib/hooks/mutations/useBulkerMutations";
import { QUERY_KEYS } from "@/lib/constants";
import type { BulkerEntry, BulkerStatus } from "@/lib/types/bulker";
import { AddBulkerEntryModal } from "@/app/(protected)/(employee)/bulkerentries/components/AddBulkerEntryModal";
import { EditBulkerEntryModal } from "./EditBulkerEntryModal";
import { ExportBulkerDataModal } from "./ExportBulkerDataModal";
import { BulkerCleanupModal } from "./BulkerCleanupModal";
import { cn, formatDateTime } from "@/lib/utils";

const STATUS_COLORS: Record<BulkerStatus, string> = {
  VRA: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  ALLOCATED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SEND: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  OUT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HOLD: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CANCEL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function BulkerAuditLogsTab() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [plantOutDate, setPlantOutDate] = useState<string>("");

  // Draft filters inside Popover
  const [draftStatus, setDraftStatus] = useState<string>("all");
  const [draftPlantOutDate, setDraftPlantOutDate] = useState<string>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BulkerEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BulkerEntry | null>(null);

  const bulkDeleteMutation = useBulkDeleteBulkerMutation();
  const deleteEntryMutation = useDeleteBulkerEntryMutation();

  const queryParams = {
    page,
    limit,
    status: status === "all" ? undefined : status,
    plant_out_at: plantOutDate || undefined,
    search: activeSearch || undefined,
  };

  const { data, isLoading, isFetching } = useAdminBulkerLogsQuery(queryParams);

  const entries = useMemo(() => data?.entries || [], [data]);
  const pagination = data?.pagination;
  const pageCount = pagination?.totalPages || 1;
  const totalItems = pagination?.total || entries.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setStatus(draftStatus);
    setPlantOutDate(draftPlantOutDate);
    setPage(1);
  };

  const handleResetFilters = () => {
    setDraftStatus("all");
    setDraftPlantOutDate("");
    setStatus("all");
    setPlantOutDate("");
    setPage(1);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    handleResetFilters();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    bulkDeleteMutation.mutate(selectedIds);
  };

  const confirmSingleDelete = () => {
    if (!deleteTarget) return;
    deleteEntryMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== "all") count++;
    if (plantOutDate) count++;
    return count;
  }, [status, plantOutDate]);

  const columns = useMemo<ColumnDef<BulkerEntry>[]>(
    () => [
      {
        accessorKey: "serialNumber",
        header: "S.N",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {row.original.serialNumber !== null && row.original.serialNumber !== undefined
              ? row.original.serialNumber
              : "_"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const val = row.original.status;
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider",
                STATUS_COLORS[val] || "bg-zinc-800 text-zinc-300 border-zinc-700"
              )}
            >
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "bulkerNumber",
        header: "Bulker No",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-xs text-white">
            {row.original.bulkerNumber}
          </span>
        ),
      },
      {
        accessorKey: "transporterName",
        header: "Transporter",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
            {row.original.transporterName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "permit",
        header: "Permit",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.permit || "—"}
          </span>
        ),
      },
      {
        accessorKey: "salesOrderNumber",
        header: "SO Number",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-300">
            {row.original.salesOrderNumber || "—"}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <span className="text-xs text-white truncate max-w-[150px] block">
            {row.original.customerName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "destination",
        header: "Destination",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
            {row.original.destination || "—"}
          </span>
        ),
      },
      {
        accessorKey: "orderDate",
        header: "Order Date",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.orderDate
              ? formatDateTime(row.original.orderDate)
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "plantOutAt",
        header: "Gate Out",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.plantOutAt
              ? formatDateTime(row.original.plantOutAt)
              : "—"}
          </span>
        ),
      },
    ],
    []
  );

  const filterContent = (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="space-y-1.5 flex flex-col">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Dispatch Status
        </label>
        <Select value={draftStatus} onValueChange={setDraftStatus}>
          <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#121316] border-border text-white text-xs">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="VRA">VRA</SelectItem>
            <SelectItem value="ALLOCATED">ALLOCATED</SelectItem>
            <SelectItem value="SEND">SEND</SelectItem>
            <SelectItem value="OUT">OUT</SelectItem>
            <SelectItem value="HOLD">HOLD</SelectItem>
            <SelectItem value="CANCEL">CANCEL</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Plant Out Date Filter */}
      <div className="space-y-1.5 flex flex-col">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Gate-Out Date
        </label>
        <DatePicker
          value={draftPlantOutDate}
          onChange={(dateStr) => setDraftPlantOutDate(dateStr || "")}
          placeholder="Filter by Gate-Out date"
          className="w-full"
        />
      </div>
    </div>
  );

  const isFiltered = activeSearch !== "" || status !== "all" || plantOutDate !== "";
  const isGlobalEmpty = totalItems === 0 && !isFiltered;

  return (
    <div className="space-y-4">
      <AdminTable
        data={entries}
        columns={columns}
        getRowId={(row: BulkerEntry) => String(row.id)}
        isLoading={isLoading}
        enablePagination={true}
        pageCount={pageCount}
        totalItems={totalItems}
        pageIndex={page - 1}
        pageSize={limit}
        onPaginationChange={(p) => {
          setPage(p.pageIndex + 1);
          setLimit(p.pageSize);
        }}
        hideToolbar={isGlobalEmpty}
        enableRowSelection={true}
        enableSerialNumber={false}
        searchPlaceholder="Search bulker, transporter, customer..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        onAddAction={() => setIsAddOpen(true)}
        addLabel="Add Bulker"
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        filterContent={filterContent}
        filterTitle="Filter Bulkers"
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        emptyStateIcon={<Truck className="w-12 h-12 text-muted-foreground/60" />}
        emptyStateTitle={
          isFiltered ? "No Matching Dispatches" : "No Bulker Entries Found"
        }
        emptyStateDescription={
          isFiltered
            ? "No dispatches match your active search query or filter criteria."
            : "No bulker dispatch records exist in the system."
        }
        emptyStateAction={
          isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="border-border text-xs text-white hover:bg-zinc-800"
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Bulker
            </Button>
          )
        }
        onDeleteSelected={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        deleteTitle="Delete Bulker Entries"
        deleteDescription={(count) =>
          `Are you sure you want to permanently delete ${count} selected bulker dispatch entries? Queue serial numbers will be recalculated automatically.`
        }
        onEditAction={(row) => {
          setSelectedEntry(row);
          setIsEditOpen(true);
        }}
        onDeleteAction={(row) => setDeleteTarget(row)}
        toolbarActions={
          <div className="flex items-center gap-1.5">
            {/* Month Cleanup (Icon-only, Rose styling) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCleanupOpen(true)}
              title="Monthly Dispatch Cleanup"
              className="w-9 h-9 p-0 shrink-0 border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300"
            >
              <Calendar className="w-4 h-4" />
              <span className="sr-only">Monthly Cleanup</span>
            </Button>

            {/* Export CSV (Icon-only) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsExportOpen(true)}
              title="Export CSV"
              className="w-9 h-9 p-0 shrink-0 bg-black/40 border-border text-muted-foreground hover:text-white"
            >
              <Download className="w-4 h-4" />
              <span className="sr-only">Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Admin Modals */}
      <AddBulkerEntryModal
        isOpen={isAddOpen}
        onClose={setIsAddOpen}
      />

      <EditBulkerEntryModal
        isOpen={isEditOpen}
        onClose={setIsEditOpen}
        selectedEntry={selectedEntry}
        isAdmin={true}
      />

      <ExportBulkerDataModal
        isOpen={isExportOpen}
        onClose={setIsExportOpen}
      />

      <BulkerCleanupModal
        isOpen={isCleanupOpen}
        onClose={setIsCleanupOpen}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmSingleDelete}
        title="Delete Bulker Dispatch"
        description={`Are you sure you want to delete the dispatch entry for "${deleteTarget?.bulkerNumber}"? This action cannot be undone.`}
        isDestructive={true}
        isPending={deleteEntryMutation.isPending}
      />
    </div>
  );
}

