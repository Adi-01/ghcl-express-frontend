"use client";

import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { useState, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import {
  Calendar as CalendarIcon,
  MapPin,
  RefreshCcw,
  Download,
  Copy,
  Plus,
  Clock,
  CalendarDays,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import type {
  AttendanceLog,
  CreateAdminAttendancePayload,
  UpdateAdminAttendancePayload,
} from "@/lib/types/attendance";
import { useAdminAttendanceLogsQuery } from "@/lib/hooks/queries/useAttendanceQuery";
import {
  useUpdateAdminAttendanceMutation,
  useBulkDeleteAttendanceMutation,
  useCreateAdminAttendanceMutation,
  useDeleteAdminAttendanceMutation,
} from "@/lib/hooks/mutations/useAttendanceMutations";
import { QUERY_KEYS } from "@/lib/constants";
import { AdminTable } from "@/components/shared/AdminTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

import { AdminAttendanceEditModal } from "./AdminAttendanceEditModal";
import { AdminAttendanceAddModal } from "./AdminAttendanceAddModal";
import { AttendanceLogsExportModal } from "./AttendanceLogsExportModal";
import { AttendanceRegisterTab } from "./AttendanceRegisterTab";

// --- Legacy Helpers ---
const getShiftType = (inTimeStr: string, outTimeStr: string | null) => {
  if (!outTimeStr)
    return {
      label: "Working",
      color: "bg-cyan-100 text-cyan-700 border-cyan-200 animate-pulse dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800",
    };
  try {
    if (isSameDay(parseISO(inTimeStr), parseISO(outTimeStr))) {
      return {
        label: "Morning",
        color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
      };
    }
    return {
      label: "Night",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
    };
  } catch {
    return {
      label: "Shift",
      color: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    };
  }
};

const formatTimeParts = (isoString: string | null | undefined) => {
  if (!isoString) return { date: "-", time: "-" };
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "-", time: "-" };
    const dateFormatted = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
    }).format(d);
    const timeFormatted = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    return { date: dateFormatted, time: timeFormatted };
  } catch {
    return { date: "-", time: "-" };
  }
};

export function AdminAttendanceClient() {
  const queryClient = useQueryClient();

  // Top Tabs: "logs" | "register"
  const [activeTab, setActiveTab] = useState<"logs" | "register">("logs");

  // Filters & State
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AttendanceLog | null>(null);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : undefined;

  const queryParams = {
    page,
    limit,
    date: formattedDate,
    search: activeSearchQuery || undefined,
  };

  const { data, isLoading, isFetching } = useAdminAttendanceLogsQuery(queryParams);

  const createMutation = useCreateAdminAttendanceMutation();
  const updateMutation = useUpdateAdminAttendanceMutation();
  const deleteMutation = useDeleteAdminAttendanceMutation();
  const bulkDeleteMutation = useBulkDeleteAttendanceMutation();

  const logs = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.entries && Array.isArray(data.entries)) return data.entries;
    if (data.results && Array.isArray(data.results)) return data.results;
    return [];
  }, [data]);

  const totalItems = data?.pagination?.total ?? data?.count ?? logs.length;
  const totalPages = data?.pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / limit));

  const handleEditSave = (id: string, payload: UpdateAdminAttendancePayload) => {
    updateMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          setIsEditModalOpen(false);
        },
      }
    );
  };

  const handleAddSave = (payload: CreateAdminAttendancePayload) => {
    createMutation.mutate(payload, {
      onSuccess: () => {
        setIsAddModalOpen(false);
      },
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchQuery);
    setPage(1);
  };

  const confirmBulkDelete = (selectedIds: string[]) => {
    bulkDeleteMutation.mutate(selectedIds);
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  // --- Table Columns Definition (Exact legacy match) ---
  const columns = useMemo<ColumnDef<AttendanceLog, any>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 130,
        cell: ({ row }) => {
          const id = row.original.id;
          return (
            <div className="flex items-center gap-2 group">
              <span className="truncate font-mono text-xs">{id}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(id);
                  toast.success("ID copied to clipboard");
                }}
                title="Copy ID"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "user_name",
        header: "Name",
        size: 160,
        cell: ({ row }) => {
          const name = row.original.user_name || row.original.userName || "Unknown";
          return (
            <div className="font-semibold whitespace-nowrap text-white text-xs" title={name}>
              {name}
            </div>
          );
        },
      },
      {
        id: "timeDetails",
        header: "Time",
        size: 380,
        cell: ({ row }) => {
          const log = row.original;
          const inTime = formatTimeParts(log.check_in_time || log.checkInTime);
          const outTime = formatTimeParts(log.check_out_time || log.checkOutTime);
          const inLat = log.in_latitude || log.inLatitude;
          const inLng = log.in_longitude || log.inLongitude;
          const outLat = log.out_latitude || log.outLatitude;
          const outLng = log.out_longitude || log.outLongitude;

          return (
            <div className="flex items-center gap-1.5 font-normal tabular-nums text-sm whitespace-nowrap">
              {/* In */}
              <div className="flex items-center gap-1 shrink-0">
                {inLat && inLng ? (
                  <a
                    href={`https://www.google.com/maps?q=${inLat},${inLng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-blue-600 shrink-0"
                  >
                    <MapPin className="size-3.5" />
                  </a>
                ) : (
                  <MapPin className="size-3.5 opacity-0" />
                )}
                <span className="whitespace-nowrap">
                  {inTime.date} {inTime.time}
                </span>
              </div>

              {/* Dash & Duration */}
              <div
                aria-hidden="true"
                className="flex items-center gap-0.5 opacity-50 before:size-1.5 before:rounded-full before:border before:border-muted-foreground after:h-px after:w-3 after:border-muted-foreground after:border-t after:border-dashed shrink-0"
              />
              <div
                className={cn(
                  "text-muted-foreground font-medium whitespace-nowrap shrink-0",
                  log.duration === "Active" && "text-blue-600 animate-pulse"
                )}
              >
                {log.duration === "Active" ? "In Progress" : log.duration}
              </div>
              <div
                aria-hidden="true"
                className="flex items-center gap-0.5 opacity-50 before:order-1 before:size-1.5 before:rounded-full before:border before:border-muted-foreground after:h-px after:w-3 after:border-muted-foreground after:border-t after:border-dashed shrink-0"
              />

              {/* Out */}
              <div className="flex items-center gap-1 shrink-0">
                {outLat && outLng ? (
                  <a
                    href={`https://www.google.com/maps?q=${outLat},${outLng}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-muted-foreground hover:text-red-600 shrink-0"
                  >
                    <MapPin className="size-3.5" />
                  </a>
                ) : (
                  <MapPin className="size-3.5 opacity-0" />
                )}
                <span className="whitespace-nowrap">
                  {outTime.date} {outTime.time}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "phone_number",
        header: "Phone",
        size: 120,
        cell: ({ row }) => (
          <div className="text-sm tabular-nums text-muted-foreground whitespace-nowrap">
            {row.original.phone_number || row.original.phoneNumber || "—"}
          </div>
        ),
      },
      {
        accessorKey: "worklocation",
        header: "Location",
        size: 110,
        cell: ({ row }) => (
          <div
            className="font-medium whitespace-nowrap text-muted-foreground"
            title={row.original.worklocation}
          >
            {row.original.worklocation}
          </div>
        ),
      },
      {
        id: "shift",
        header: "Shift",
        size: 100,
        cell: ({ row }) => {
          const shift = getShiftType(
            row.original.check_in_time || row.original.checkInTime,
            row.original.check_out_time || row.original.checkOutTime
          );
          return (
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
                shift.color
              )}
            >
              {shift.label}
            </span>
          );
        },
      },
    ],
    []
  );

  const refreshPage = async () => {
    setDate(undefined);
    setSearchQuery("");
    setActiveSearchQuery("");
    setPage(1);

    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.attendance.all,
    });
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-2 sm:p-4 lg:p-6">
      {/* Tab Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">


        {/* Tab switch buttons */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg self-start sm:self-auto border border-border">
          <Button
            size="sm"
            variant={activeTab === "logs" ? "default" : "ghost"}
            onClick={() => setActiveTab("logs")}
            className="h-8 text-xs font-semibold px-3"
          >
            
            Logs
          </Button>
          <Button
            size="sm"
            variant={activeTab === "register" ? "default" : "ghost"}
            onClick={() => setActiveTab("register")}
            className="h-8 text-xs font-semibold px-3"
          >
            
            Register
          </Button>
        </div>
      </div>

      {activeTab === "register" ? (
        <AttendanceRegisterTab />
      ) : (
        <>
          <AdminTable
            data={logs}
            columns={columns}
            getRowId={(row: AttendanceLog) => row.id}
            isLoading={isLoading}
            pageCount={totalPages}
            totalItems={totalItems}
            pageIndex={page - 1}
            pageSize={limit}
            onPaginationChange={(p) => {
              setPage(p.pageIndex + 1);
              setLimit(p.pageSize);
            }}
            searchPlaceholder="Search by location, phone, name..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onDeleteSelected={confirmBulkDelete}
            isDeleting={bulkDeleteMutation.isPending}
            deleteTitle="Delete Attendance Records"
            emptyStateTitle="No Logs Found"
            emptyStateDescription={
              activeSearchQuery || formattedDate
                ? "No attendance records found matching your current filters."
                : "There are no attendance records to display."
            }
            onEditAction={(row: AttendanceLog) => {
              setSelectedLog(row);
              setIsEditModalOpen(true);
            }}
            onDeleteAction={(row: AttendanceLog) => setDeleteTarget(row)}
            toolbarActions={
              <>
                {/* Date Filter Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      title={date ? format(date, "PPP") : "Filter by date..."}
                      className={cn(
                        "justify-center w-10 px-0 font-normal bg-muted/50 shrink-0",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="h-4 w-4 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => {
                        setDate(newDate);
                        setPage(1);
                      }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Refresh */}
                <Button
                  variant="outline"
                  onClick={refreshPage}
                  title="Clear Filters & Refresh"
                  className="w-10 px-0 bg-muted/50 shrink-0"
                >
                  <RefreshCcw
                    className={cn("w-4 h-4", isFetching && "animate-spin")}
                  />
                </Button>

                {/* Export */}
                <Button
                  variant="outline"
                  title="Export"
                  onClick={() => setIsExportModalOpen(true)}
                  className="w-10 px-0 bg-muted/50 shrink-0"
                >
                  <Download className="w-4 h-4" />
                </Button>

                {/* Add */}
                <Button
                  variant="default"
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-10 px-0 shrink-0"
                  title="Add Manual Log"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </>
            }
          />

          {/* Modals */}
          <AdminAttendanceAddModal
            isOpen={isAddModalOpen}
            onClose={setIsAddModalOpen}
            onSave={handleAddSave}
            isBusy={createMutation.isPending}
          />
          <AdminAttendanceEditModal
            isOpen={isEditModalOpen}
            onClose={setIsEditModalOpen}
            log={selectedLog}
            onSave={handleEditSave}
            isBusy={updateMutation.isPending}
          />
          <AttendanceLogsExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
          />

          {/* Delete Single Confirm Modal */}
          <ConfirmModal
            isOpen={Boolean(deleteTarget)}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDeleteSingle}
            title="Delete Attendance Record"
            description={`Are you sure you want to delete this shift record for ${deleteTarget?.user_name || deleteTarget?.userName || "this user"}?`}
            confirmText="Delete"
            isDestructive={true}
            isPending={deleteMutation.isPending}
          />
        </>
      )}
    </div>
  );
}
