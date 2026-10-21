"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { Plus, RefreshCcw, MoreHorizontal, Edit, LogOut } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EmployeeTable } from "@/components/shared/EmployeeTable";

import { useNightCheckingEntriesQuery } from "@/lib/hooks/queries/useNightCheckingQuery";
import {
  useCreateTruckEntryMutation,
  useUpdateTruckEntryMutation,
  useMarkOutTruckMutation,
} from "@/lib/hooks/mutations/useNightCheckingMutations";
import { useProfileQuery } from "@/lib/hooks/queries/useProfileQuery";
import { QUERY_KEYS } from "@/lib/constants";
import type {
  TruckEntry,
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";
import { cn, getDurationInfo, formatDateTimeObject } from "@/lib/utils";
import { TruckEntryModal } from "./TruckEntryModal";

export function NightCheckingClient() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfileQuery();

  const userLabels = useMemo(() => {
    return new Set(
      (profile?.labels || []).map((l: string) => String(l).toUpperCase())
    );
  }, [profile]);

  const hasFullAccess =
    userLabels.has("GHCL") ||
    userLabels.has("ADMIN") ||
    userLabels.has("SUPERADMIN") ||
    Boolean(profile?.is_admin);
  const isViewer = !hasFullAccess && userLabels.has("GHCL-VIEWER");

  // Tab & Pagination State
  const [activeTab, setActiveTab] = useState<"IN" | "OUT">("IN");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TruckEntry | null>(null);

  const queryParams = {
    page,
    limit,
    status: activeTab,
    search: activeSearch || undefined,
  };

  const { data, isLoading, isFetching } = useNightCheckingEntriesQuery(queryParams);

  const createMutation = useCreateTruckEntryMutation();
  const updateMutation = useUpdateTruckEntryMutation();
  const markOutMutation = useMarkOutTruckMutation();

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
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
  };

  const handleOpenNew = () => {
    setSelectedEntry(null);
    setIsModalOpen(true);
  };

  const handleEdit = (entry: TruckEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleMarkOut = (entry: TruckEntry) => {
    markOutMutation.mutate({
      id: entry.id,
      exitDate: new Date().toISOString(),
    });
  };

  const handleSubmit = (payload: CreateTruckEntryPayload | UpdateTruckEntryPayload) => {
    if (selectedEntry) {
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
        size: 160,
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
        id: "timeDetails",
        header: "Time & Standby Duration",
        size: 380,
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
        accessorKey: "paper_status",
        header: "Paper",
        size: 80,
        cell: ({ row }) => {
          const ok = Boolean(row.original.paperStatus ?? row.original.paper_status);
          return (
            <Badge
              variant={ok ? "secondary" : "destructive"}
              className={cn(
                "text-[10px] uppercase font-semibold h-5 px-1.5",
                ok && "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
              )}
            >
              {ok ? "OK" : "NO"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "driver_status",
        header: "Driver",
        size: 80,
        cell: ({ row }) => {
          const ok = Boolean(row.original.driverStatus ?? row.original.driver_status);
          return (
            <Badge
              variant={ok ? "secondary" : "destructive"}
              className={cn(
                "text-[10px] uppercase font-semibold h-5 px-1.5",
                ok && "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
              )}
            >
              {ok ? "OK" : "NO"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "tarpulin_status",
        header: "Tarpaulin",
        size: 90,
        cell: ({ row }) => {
          const ok = Boolean(row.original.tarpulinStatus ?? row.original.tarpulin_status);
          return (
            <Badge
              variant={ok ? "secondary" : "destructive"}
              className={cn(
                "text-[10px] uppercase font-semibold h-5 px-1.5",
                ok && "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
              )}
            >
              {ok ? "OK" : "NO"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 150,
        cell: ({ row }) => (
          <span
            className="text-xs text-muted-foreground truncate block max-w-[140px]"
            title={row.original.remarks || ""}
          >
            {row.original.remarks || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Action",
        size: 70,
        enableHiding: false,
        cell: ({ row }) => {
          const entry = row.original;
          if (isViewer || !hasFullAccess) return null;

          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#121316] border border-border text-white shadow-lg">
                  <DropdownMenuItem
                    onClick={() => handleEdit(entry)}
                    className="cursor-pointer hover:bg-zinc-800 text-xs"
                  >
                    <Edit className="mr-2 h-3.5 w-3.5 text-zinc-400" />
                    Edit
                  </DropdownMenuItem>
                  {entry.status === "IN" && (
                    <DropdownMenuItem
                      onClick={() => handleMarkOut(entry)}
                      className="cursor-pointer text-amber-400 hover:bg-zinc-800 text-xs"
                    >
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Mark Out
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [isViewer, hasFullAccess]
  );

  const editMode = activeTab === "OUT" ? "exit_only" : "full";

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Night Checking Entries
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Plant perimeter gate nocturnal security checks and safety compliance roster.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as "IN" | "OUT");
          setPage(1);
        }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-[#121316] border border-border p-1 h-10 rounded-lg">
            <TabsTrigger
              value="IN"
              className="text-xs px-4 py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-muted-foreground flex items-center gap-2"
            >
              IN Trucks
              {activeTab === "IN" && entries.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950/80 text-emerald-400 font-mono border border-emerald-900">
                  {entries.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="OUT"
              className="text-xs px-4 py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-muted-foreground"
            >
              Marked OUT
            </TabsTrigger>
          </TabsList>
        </div>

        <EmployeeTable
          data={entries}
          columns={columns}
          getRowId={(row: TruckEntry) => String(row.id)}
          isLoading={isLoading}
          enablePagination={activeTab === "OUT"}
          pageIndex={page - 1}
          pageSize={limit}
          pageCount={pageCount}
          totalItems={totalItems}
          onPaginationChange={(pagination) => {
            setPage(pagination.pageIndex + 1);
            setLimit(pagination.pageSize);
          }}
          enableSerialNumber={true}
          searchPlaceholder="Search truck no or transporter..."
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onAddAction={!isViewer && hasFullAccess && activeTab === "IN" ? handleOpenNew : undefined}
          addLabel="Check In Truck"
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          emptyStateTitle={activeTab === "IN" ? "No Trucks Currently IN" : "No Marked OUT Trucks Found"}
          emptyStateDescription={
            activeSearch
              ? "No truck records match your search query."
              : activeTab === "IN"
              ? "No incoming trucks are currently logged inside the plant perimeter."
              : "No checked out truck records found."
          }
          emptyStateAction={
            !isViewer && hasFullAccess && activeTab === "IN" ? (
              <Button
                onClick={handleOpenNew}
                className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium text-xs"
              >
                <Plus className="w-4 h-4" />
                Check In Truck
              </Button>
            ) : undefined
          }
        />
      </Tabs>

      {/* Modal */}
      <TruckEntryModal
        isOpen={isModalOpen}
        onClose={setIsModalOpen}
        selectedEntry={selectedEntry}
        onSubmit={handleSubmit}
        isBusy={createMutation.isPending || updateMutation.isPending}
        editMode={editMode}
      />
    </div>
  );
}
