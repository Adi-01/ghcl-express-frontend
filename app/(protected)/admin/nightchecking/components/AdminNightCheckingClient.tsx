"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  Plus,
  RefreshCcw,
  Calendar,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

import { useAdminNightCheckingLogsQuery } from "@/lib/hooks/queries/useNightCheckingQuery";
import {
  useCreateAdminTruckEntryMutation,
  useUpdateAdminTruckEntryMutation,
  useDeleteAdminTruckEntryMutation,
  useBulkDeleteTruckEntriesMutation,
} from "@/lib/hooks/mutations/useNightCheckingMutations";
import { QUERY_KEYS } from "@/lib/constants";
import type {
  TruckEntry,
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";
import { cn, getDurationInfo, formatDateTimeObject } from "@/lib/utils";
import { TruckEntryModal } from "@/app/(protected)/(employee)/nightchecking/components/TruckEntryModal";
import { NightCheckingExportModal } from "./NightCheckingExportModal";
import { NightCheckingCleanupModal } from "./NightCheckingCleanupModal";

const StatusIcon = ({ status }: { status: boolean }) =>
  status ? (
    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
  ) : (
    <XCircle className="w-4 h-4 text-rose-400" />
  );

export function AdminNightCheckingClient() {
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [date, setDate] = useState<string>("");

  // Draft filters inside Popover
  const [draftStatus, setDraftStatus] = useState<string>("all");
  const [draftDate, setDraftDate] = useState<string>("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TruckEntry | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TruckEntry | null>(null);

  const queryParams = {
    page,
    limit,
    status: status === "all" ? undefined : status,
    date: date || undefined,
    search: activeSearch || undefined,
  };

  const { data, isLoading, isFetching } = useAdminNightCheckingLogsQuery(queryParams);

  const createMutation = useCreateAdminTruckEntryMutation();
  const updateMutation = useUpdateAdminTruckEntryMutation();
  const deleteMutation = useDeleteAdminTruckEntryMutation();
  const bulkDeleteMutation = useBulkDeleteTruckEntriesMutation();

  const entries = useMemo(() => data?.entries || [], [data]);
  const pagination = data?.pagination;
  const pageCount = pagination?.totalPages || 1;
  const totalItems = pagination?.total || entries.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleApplyFilters = () => {
    setStatus(draftStatus);
    setDate(draftDate);
    setPage(1);
  };

  const handleResetFilters = () => {
    setDraftStatus("all");
    setDraftDate("");
    setStatus("all");
    setDate("");
    setPage(1);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    handleResetFilters();
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
  };

  const handleBulkDelete = (selectedIds: string[]) => {
    bulkDeleteMutation.mutate(selectedIds);
  };

  const confirmSingleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleFormSubmit = (payload: CreateTruckEntryPayload | UpdateTruckEntryPayload) => {
    if (selectedEntry?.id) {
      updateMutation.mutate(
        { id: selectedEntry.id, payload },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      createMutation.mutate(payload as CreateTruckEntryPayload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (status !== "all") count++;
    if (date) count++;
    return count;
  }, [status, date]);

  const columns = useMemo<ColumnDef<TruckEntry, any>[]>(
    () => [
      {
        accessorKey: "truck_number",
        header: "Truck No",
        size: 140,
        cell: ({ row }) => {
          const num = row.original.truckNumber || row.original.truck_number;
          return <span className="font-mono font-bold text-white text-xs">{num}</span>;
        },
      },
      {
        accessorKey: "transporter_name",
        header: "Transporter",
        size: 180,
        cell: ({ row }) => {
          const name = row.original.transporterName || row.original.transporter_name;
          return (
            <span className="text-zinc-200 text-xs truncate block max-w-[170px]" title={name}>
              {name || "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 90,
        cell: ({ row }) => {
          const isIN = row.original.status === "IN";
          return (
            <div className="flex justify-center">
              <Badge
                variant={isIN ? "secondary" : "outline"}
                className={cn(
                  "text-[10px] uppercase font-semibold h-5 px-2",
                  isIN
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-900"
                    : "bg-zinc-900 text-zinc-400 border-zinc-700"
                )}
              >
                {row.original.status}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: "paper_status",
        header: "Paper",
        size: 70,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusIcon status={Boolean(row.original.paperStatus ?? row.original.paper_status)} />
          </div>
        ),
      },
      {
        accessorKey: "driver_status",
        header: "Driver",
        size: 70,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusIcon status={Boolean(row.original.driverStatus ?? row.original.driver_status)} />
          </div>
        ),
      },
      {
        accessorKey: "tarpulin_status",
        header: "Tarpaulin",
        size: 80,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <StatusIcon status={Boolean(row.original.tarpulinStatus ?? row.original.tarpulin_status)} />
          </div>
        ),
      },
      {
        id: "timeDetails",
        header: "Time & Standby Duration",
        size: 340,
        cell: ({ row }) => {
          const entryDate = row.original.entryDate || row.original.entry_date;
          const exitDate = row.original.exitDate || row.original.exit_date;
          const inTime = formatDateTimeObject(entryDate);
          const outTime = formatDateTimeObject(exitDate);
          const durationInfo = getDurationInfo(entryDate, exitDate);

          return (
            <div className="flex items-center gap-1.5 font-normal tabular-nums text-xs">
              <span className="whitespace-nowrap text-zinc-300">
                {typeof inTime === "object" ? `${inTime.date} ${inTime.time}` : "-"}
              </span>

              <div
                aria-hidden="true"
                className="flex items-center gap-0.5 opacity-50 before:size-1.5 before:rounded-full before:border before:border-muted-foreground after:h-px after:w-3 after:border-muted-foreground after:border-t after:border-dashed"
              />

              <span
                className={cn(
                  "font-medium whitespace-nowrap px-1 py-0.5 rounded text-[11px]",
                  durationInfo.isOverLimit
                    ? "text-rose-400 bg-rose-500/10 font-semibold"
                    : "text-zinc-400"
                )}
              >
                {durationInfo.text}
              </span>

              <div
                aria-hidden="true"
                className="flex items-center gap-0.5 opacity-50 before:order-1 before:size-1.5 before:rounded-full before:border before:border-muted-foreground after:h-px after:w-3 after:border-muted-foreground after:border-t after:border-dashed"
              />

              <span className="whitespace-nowrap text-zinc-300">
                {typeof outTime === "object" ? `${outTime.date} ${outTime.time}` : "-"}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 140,
        cell: ({ row }) => (
          <span
            className="text-xs text-muted-foreground truncate block max-w-[130px]"
            title={row.original.remarks || ""}
          >
            {row.original.remarks || "—"}
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
          Gate Status
        </label>
        <Select value={draftStatus} onValueChange={setDraftStatus}>
          <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-[#121316] border-border text-white text-xs">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="IN">Currently IN</SelectItem>
            <SelectItem value="OUT">Marked OUT</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Filter */}
      <div className="space-y-1.5 flex flex-col">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Entry Date (IST)
        </label>
        <DatePicker
          value={draftDate}
          onChange={(dateStr) => setDraftDate(dateStr || "")}
          placeholder="Filter by check-in date"
          className="w-full"
        />
      </div>
    </div>
  );

  const isFiltered = activeSearch !== "" || status !== "all" || date !== "";
  const isGlobalEmpty = totalItems === 0 && !isFiltered;

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Night Checking Logs
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Historical master inspection database, bulk compliance deletion, and retention archiving.
        </p>
      </div>

      <AdminTable
        data={entries}
        columns={columns}
        getRowId={(row: TruckEntry) => String(row.id)}
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
        enableSerialNumber={true}
        searchPlaceholder="Search truck no or transporter..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearchSubmit}
        onAddAction={() => {
          setSelectedEntry(null);
          setIsModalOpen(true);
        }}
        addLabel="Add Truck Entry"
        onRefresh={handleRefresh}
        isRefreshing={isFetching}
        filterContent={filterContent}
        filterTitle="Filter Night Checking"
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        onDeleteSelected={handleBulkDelete}
        isDeleting={bulkDeleteMutation.isPending}
        deleteTitle="Delete Truck Records"
        deleteDescription={(count) =>
          `Are you sure you want to soft-delete ${count} selected truck inspection record(s)?`
        }
        onEditAction={(row) => {
          setSelectedEntry(row);
          setIsModalOpen(true);
        }}
        onDuplicateAction={(row) => {
          setSelectedEntry({ ...row, id: "" });
          setIsModalOpen(true);
        }}
        onDeleteAction={(row) => setDeleteTarget(row)}
        emptyStateTitle={isFiltered ? "No Matching Inspection Records" : "No Truck Entries Found"}
        emptyStateDescription={
          isFiltered
            ? "No records match your active search query or filter criteria."
            : "No truck inspection records exist in the system."
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
              onClick={() => {
                setSelectedEntry(null);
                setIsModalOpen(true);
              }}
              className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Truck Entry
            </Button>
          )
        }
        toolbarActions={
          <div className="flex items-center gap-1.5">
            {/* Month Cleanup (Icon-only, Rose styling) */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsCleanupOpen(true)}
              title="Monthly Data Cleanup"
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
      <TruckEntryModal
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        selectedEntry={selectedEntry}
        onSubmit={handleFormSubmit}
        isBusy={createMutation.isPending || updateMutation.isPending}
        isAdmin={true}
      />

      <NightCheckingExportModal
        isOpen={isExportOpen}
        onClose={setIsExportOpen}
      />

      <NightCheckingCleanupModal
        isOpen={isCleanupOpen}
        onClose={setIsCleanupOpen}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmSingleDelete}
        title="Delete Truck Entry"
        description={`Are you sure you want to delete the inspection record for "${
          deleteTarget?.truckNumber || deleteTarget?.truck_number
        }"?`}
        isDestructive={true}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

