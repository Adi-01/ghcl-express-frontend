"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { useQueryClient } from "@tanstack/react-query";
import { Truck, RotateCcw, Clock, Info, ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";

import { EmployeeTable } from "@/components/shared/EmployeeTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkerEntriesQuery } from "@/lib/hooks/queries/useBulkerQuery";
import { QUERY_KEYS } from "@/lib/constants";
import type { BulkerEntry, BulkerStatus } from "@/lib/types/bulker";
import { cn, formatDateTime } from "@/lib/utils";
import { UpdatePlantOutModal } from "./UpdatePlantOutModal";
import { BulkerMobileList } from "./BulkerMobileList";
import { PrevTripModal } from "./PrevTripModal";

const STATUS_COLORS: Record<string, string> = {
  OUT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  CANCEL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function UnactiveBulkerTable() {
  const queryClient = useQueryClient();

  // Search & Pagination State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // Modal State for Plant Out timing
  const [selectedEntry, setSelectedEntry] = useState<BulkerEntry | null>(null);
  const [isPlantOutOpen, setIsPlantOutOpen] = useState(false);

  // Modal State for Previous Trip Details
  const [selectedPrevTrip, setSelectedPrevTrip] = useState<BulkerEntry | null>(null);

  const queryParams = {
    page,
    limit,
    status: "unactive",
    search: activeSearch || undefined,
  };

  const { data, isLoading, isFetching } = useBulkerEntriesQuery(queryParams);

  const entries = useMemo(() => data?.entries || [], [data]);
  const pagination = data?.pagination;
  const pageCount = pagination?.totalPages || 1;
  const totalItems = pagination?.total || entries.length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    setPage(1);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
  };

  const columns: ColumnDef<BulkerEntry, any>[] = useMemo(
    () => [
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = (row.original.status || "OUT") as BulkerStatus;
          const badgeClass =
            STATUS_COLORS[s] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
          return (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                badgeClass
              )}
            >
              {s}
            </span>
          );
        },
      },
      {
        accessorKey: "bulkerNumber",
        header: "Bulker No",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 font-mono font-semibold text-white text-xs">
            <span>{row.original.bulkerNumber}</span>
            <button
              type="button"
              onClick={() => setSelectedPrevTrip(row.original)}
              className="p-1 text-zinc-400 hover:text-sky-400 hover:bg-white/10 rounded transition-colors"
              title="View previous trip details"
            >
              <Info className="w-3.5 h-3.5" />
              <span className="sr-only">Previous trip details</span>
            </button>
          </div>
        ),
      },
      {
        accessorKey: "transporterName",
        header: "Transporter",
        cell: ({ row }) => (
          <span className="text-zinc-300 text-xs">
            {row.original.transporterName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "permit",
        header: "Permit",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-400">
            {row.original.permit || "—"}
          </span>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer Name",
        cell: ({ row }) => (
          <span className="text-white text-xs font-medium">
            {row.original.customerName || "—"}
          </span>
        ),
      },
      {
        accessorKey: "destination",
        header: "Destination",
        cell: ({ row }) => (
          <span className="text-zinc-300 text-xs">
            {row.original.destination || "—"}
          </span>
        ),
      },
      {
        accessorKey: "salesOrderNumber",
        header: "SO Number",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-400">
            {row.original.salesOrderNumber || "—"}
          </span>
        ),
      },
      {
        id: "eventTime",
        header: "Out / Cancel Time",
        cell: ({ row }) => {
          const entry = row.original;
          const timestamp =
            entry.status === "OUT" ? entry.plantOutAt : entry.updatedAt;
          return (
            <span className="text-xs text-zinc-400 whitespace-nowrap">
              {timestamp ? formatDateTime(timestamp) : "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        cell: ({ row }) => (
          <span className="text-xs text-zinc-400 truncate max-w-[200px] block">
            {row.original.remarks || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 50,
        cell: ({ row }) => {
          const entry = row.original;
          if (entry.status !== "OUT") return null;
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedEntry(entry);
                setIsPlantOutOpen(true);
              }}
              title="Update Plant Out Timing"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
            >
              <Clock className="w-3.5 h-3.5" />
              <span className="sr-only">Update Plant Out Timing</span>
            </Button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Desktop & Tablet Table */}
      <div className="hidden md:block">
        <EmployeeTable
          data={entries}
          columns={columns}
          getRowId={(r) => r.id}
          isLoading={isLoading}
          totalItems={totalItems}
          pageCount={pageCount}
          pageIndex={page - 1}
          pageSize={limit}
          onPaginationChange={(pagination) => {
            setPage(pagination.pageIndex + 1);
            setLimit(pagination.pageSize);
          }}
          searchPlaceholder="Search today's completed/cancelled bulkers..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          enableSerialNumber={true}
          emptyStateIcon={<Truck className="w-8 h-8 text-zinc-600" />}
          emptyStateTitle={
            activeSearch
              ? "No matching bulkers found"
              : "No completed or cancelled bulkers today"
          }
          emptyStateDescription={
            activeSearch
              ? "No completed or cancelled dispatches matched your search query. Try clearing the search."
              : "Any bulkers marked as OUT or CANCEL today will automatically appear here."
          }
          emptyStateAction={
            activeSearch ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs bg-transparent border-border text-white hover:bg-zinc-800"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Clear Search
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Mobile Screen: Compact List Pattern */}
      <div className="md:hidden space-y-3">
        {/* Mobile Search & Refresh Bar */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <Input
              placeholder="Search unactive bulkers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="bg-black/40 border-border text-white text-xs h-9 w-full"
            />
          </form>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            title="Refresh"
            className="w-9 h-9 p-0 bg-black/40 border-border text-muted-foreground hover:text-white shrink-0"
          >
            <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* Mobile List */}
        <BulkerMobileList
          entries={entries}
          isLoading={isLoading}
          startIndex={(page - 1) * limit}
          canEditEntry={(entry) => entry.status === "OUT"}
          onOpenEdit={(entry) => {
            if (entry.status === "OUT") {
              setSelectedEntry(entry);
              setIsPlantOutOpen(true);
            }
          }}
          emptyStateTitle={
            activeSearch
              ? "No matching bulkers found"
              : "No completed or cancelled bulkers today"
          }
          emptyStateDescription={
            activeSearch
              ? "No completed or cancelled dispatches match your search."
              : "Any bulkers marked as OUT or CANCEL today will appear here."
          }
          emptyStateAction={
            activeSearch ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="text-xs bg-transparent border-border text-white hover:bg-zinc-800"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Clear Search
              </Button>
            ) : undefined
          }
        />

        {/* Mobile Pagination Controls */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
            <span className="text-zinc-500 font-mono">
              Page {page} of {pageCount} ({totalItems} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2.5 text-xs bg-black/40 border-border text-zinc-300 hover:text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount || isFetching}
                className="h-8 px-2.5 text-xs bg-black/40 border-border text-zinc-300 hover:text-white"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UpdatePlantOutModal
        isOpen={isPlantOutOpen}
        onClose={setIsPlantOutOpen}
        selectedEntry={selectedEntry}
      />

      <PrevTripModal
        isOpen={Boolean(selectedPrevTrip)}
        onClose={() => setSelectedPrevTrip(null)}
        entry={selectedPrevTrip}
      />
    </div>
  );
}
