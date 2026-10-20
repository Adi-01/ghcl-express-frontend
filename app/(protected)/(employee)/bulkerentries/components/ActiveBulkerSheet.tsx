"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Truck,
  Loader2,
  MoreHorizontal,
  Edit,
  Trash2,
  ShieldAlert,
  FolderSearch,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import type { BulkerEntry, BulkerStatus, BulkerInfo, CustomerInfo } from "@/lib/types/bulker";
import {
  useBulkerInfoQuery,
  useCustomerInfoQuery,
} from "@/lib/hooks/queries/useBulkerQuery";
import { useUpdateBulkerEntryMutation, useDeleteBulkerEntryMutation } from "@/lib/hooks/mutations/useBulkerMutations";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { cn, formatDateTime } from "@/lib/utils";

interface ActiveBulkerSheetProps {
  entries: BulkerEntry[];
  isLoading: boolean;
  isViewer: boolean;
  isAdmin?: boolean;
  onOpenEditModal?: (entry: BulkerEntry) => void;
  onOpenStatusModal?: (entry: BulkerEntry) => void;
  page?: number;
  pageCount?: number;
  limit?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  emptyStateAction?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

const ACTIVE_STATUSES: BulkerStatus[] = ["VRA", "ALLOCATED", "SEND", "HOLD", "OUT", "CANCEL"];

export function getAvailableNextStatuses(
  currentStatus: BulkerStatus,
  hasPlantIn: boolean = false
): BulkerStatus[] {
  switch (currentStatus) {
    case "VRA":
      return ["VRA"];
    case "ALLOCATED":
      return ["ALLOCATED", "SEND", "HOLD", "CANCEL"];
    case "SEND":
      return ["SEND", "OUT", "HOLD", "CANCEL"];
    case "HOLD":
      return hasPlantIn
        ? ["HOLD", "SEND", "OUT", "CANCEL"]
        : ["HOLD", "ALLOCATED", "SEND", "CANCEL"];
    case "OUT":
      return ["OUT"];
    case "CANCEL":
      return ["CANCEL"];
    default:
      return [currentStatus];
  }
}

// Fully invisible Google Sheets-style input styling (ZERO focus rings, outlines, borders, or backgrounds)
const SHEET_INPUT_CLASS =
  "w-full h-8 px-2.5 py-1 text-xs text-white bg-transparent border-0 border-transparent rounded-none outline-none shadow-none focus:outline-none focus:ring-0 focus:border-0 focus:bg-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 transition-colors placeholder:text-zinc-600 truncate";

/* -------------------------------------------------------------------------- */
/* Bulker Number Cell with In-Cell Writing + Google-Search Style Dropdown     */
/* -------------------------------------------------------------------------- */
interface BulkerNumberCellProps {
  row: BulkerEntry;
  isViewer: boolean;
  bulkerInfoList: BulkerInfo[];
  onSelectBulker: (entryId: string, bulker: BulkerInfo) => Promise<void>;
  onCommitManual: (entryId: string, value: string) => Promise<void>;
  onDoubleClick: () => void;
}

function BulkerNumberCell({
  row,
  isViewer,
  bulkerInfoList,
  onSelectBulker,
  onCommitManual,
  onDoubleClick,
}: BulkerNumberCellProps) {
  const [val, setVal] = useState(row.bulkerNumber || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setVal(row.bulkerNumber || "");
  }, [row.bulkerNumber]);

  const filtered = useMemo(() => {
    if (!bulkerInfoList) return [];
    const q = val.trim().toLowerCase();
    if (!q) return bulkerInfoList.slice(0, 12);
    return bulkerInfoList
      .filter(
        (b) =>
          b.bulkerNumber.toLowerCase().includes(q) ||
          (b.transporterName && b.transporterName.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [bulkerInfoList, val]);

  if (isViewer) {
    return (
      <div
        onDoubleClick={onDoubleClick}
        className="w-full h-8 px-2.5 py-1.5 font-mono text-xs font-semibold text-white cursor-pointer select-none truncate flex items-center"
        title="Double-click to view last trip"
      >
        {val || "—"}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full h-8">
          <input
            type="text"
            value={val}
            onDoubleClick={onDoubleClick}
            onChange={(e) => {
              setVal(e.target.value.toUpperCase());
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onBlur={() => {
              setIsOpen(false);
              const trimmed = val.trim();
              if (!trimmed) {
                // Cannot empty bulker number: revert back immediately
                setVal(row.bulkerNumber || "");
                return;
              }
              if (trimmed !== row.bulkerNumber) {
                const match = bulkerInfoList.find(
                  (b) => b.bulkerNumber.toLowerCase() === trimmed.toLowerCase()
                );
                if (match) {
                  onSelectBulker(row.id, match);
                } else {
                  onCommitManual(row.id, trimmed);
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="Bulker no..."
            title="Type to search or double-click to view last trip"
            className={cn(
              SHEET_INPUT_CLASS,
              "font-mono font-semibold"
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={2}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-64 p-1 bg-[#121316] border border-border text-white shadow-2xl rounded-lg z-50 max-h-56 overflow-y-auto"
      >
        {filtered.length === 0 ? (
          <div className="py-2.5 px-3 text-center text-zinc-500 text-[11px]">
            No matching bulkers
          </div>
        ) : (
          filtered.map((b) => (
            <button
              key={b.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setVal(b.bulkerNumber);
                setIsOpen(false);
                onSelectBulker(row.id, b);
              }}
              className="w-full text-left py-1.5 px-2 hover:bg-white/[0.06] rounded transition-colors flex items-center justify-between"
            >
              <div>
                <div className="font-mono font-medium text-white text-xs">
                  {b.bulkerNumber}
                </div>
                <div className="text-[10px] text-zinc-400 truncate max-w-[150px]">
                  {b.transporterName || "No transporter"}
                </div>
              </div>
              {!b.isAllowed ? (
                <span className="text-[9px] font-semibold uppercase px-1 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  NOT ALLOWED
                </span>
              ) : (
                b.permit && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {b.permit}
                  </span>
                )
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Customer Name Cell with In-Cell Writing + Google-Search Style Dropdown     */
/* -------------------------------------------------------------------------- */
interface CustomerNameCellProps {
  row: BulkerEntry;
  isViewer: boolean;
  customerInfoList: CustomerInfo[];
  onSelectCustomer: (row: BulkerEntry, customer: CustomerInfo) => Promise<void>;
  onCommitManual: (entryId: string, customerName: string) => Promise<void>;
}

function CustomerNameCell({
  row,
  isViewer,
  customerInfoList,
  onSelectCustomer,
  onCommitManual,
}: CustomerNameCellProps) {
  const [val, setVal] = useState(row.customerName || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setVal(row.customerName || "");
  }, [row.customerName]);

  const filtered = useMemo(() => {
    if (!customerInfoList) return [];
    const q = val.trim().toLowerCase();
    if (!q) return customerInfoList.slice(0, 12);
    return customerInfoList
      .filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          (c.destination && c.destination.toLowerCase().includes(q))
      )
      .slice(0, 12);
  }, [customerInfoList, val]);

  if (isViewer) {
    return (
      <div className="w-full h-8 px-2.5 py-1.5 text-xs text-white truncate flex items-center">
        {val || "—"}
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className="relative w-full h-8">
          <input
            type="text"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
            }}
            onBlur={() => {
              setIsOpen(false);
              const trimmed = val.trim();
              const isMandatoryStatus =
                row.status === "ALLOCATED" ||
                row.status === "SEND" ||
                row.status === "HOLD";

              if (!trimmed && isMandatoryStatus) {
                // If status is ALLOCATED, SEND, or HOLD, do not let user empty customer name: revert back!
                setVal(row.customerName || "");
                toast.error(
                  "Customer name cannot be empty when dispatch is Allocated, Send, or Hold."
                );
                return;
              }

              if (trimmed !== (row.customerName || "")) {
                if (!trimmed) {
                  onCommitManual(row.id, "");
                  return;
                }
                const match = customerInfoList.find(
                  (c) => c.customerName.toLowerCase() === trimmed.toLowerCase()
                );
                if (match) {
                  onSelectCustomer(row, match);
                } else {
                  setVal(row.customerName || "");
                  toast.error(
                    `Customer "${trimmed}" not found in Master Registry. Please choose a valid customer.`
                  );
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              } else if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
            placeholder="Customer name..."
            title="Type to search customer"
            className={SHEET_INPUT_CLASS}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        sideOffset={2}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-72 p-1 bg-[#121316] border border-border text-white shadow-2xl rounded-lg z-50 max-h-56 overflow-y-auto"
      >
        {filtered.length === 0 ? (
          <div className="py-2.5 px-3 text-center text-zinc-500 text-[11px]">
            No matching customers
          </div>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setVal(c.customerName);
                setIsOpen(false);
                onSelectCustomer(row, c);
              }}
              className="w-full text-left py-1.5 px-2 hover:bg-white/[0.06] rounded transition-colors flex items-center justify-between"
            >
              <div className="truncate mr-2">
                <div className="font-medium text-white text-xs truncate">
                  {c.customerName}
                </div>
              </div>
              {c.destination && (
                <span className="text-[10px] text-sky-400 font-medium shrink-0">
                  {c.destination}
                </span>
              )}
            </button>
          ))
        )}
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Main ActiveBulkerSheet Component                                          */
/* -------------------------------------------------------------------------- */
export function ActiveBulkerSheet({
  entries,
  isLoading,
  isViewer,
  isAdmin,
  onOpenEditModal,
  onOpenStatusModal,
  page = 1,
  pageCount = 1,
  limit = 20,
  totalItems = 0,
  onPageChange,
  emptyStateAction,
  emptyStateTitle,
  emptyStateDescription,
}: ActiveBulkerSheetProps) {
  const { data: bulkerInfoList = [] } = useBulkerInfoQuery();
  const { data: customerInfoList = [] } = useCustomerInfoQuery();
  const updateMutation = useUpdateBulkerEntryMutation();
  const deleteMutation = useDeleteBulkerEntryMutation();

  // Cancel Confirmation Dialog State
  const [cancelTargetEntry, setCancelTargetEntry] = useState<BulkerEntry | null>(null);

  // Last Trip Modal Dialog State (Triggered on Double-Click)
  const [lastTripEntry, setLastTripEntry] = useState<BulkerEntry | null>(null);

  // Helper to trigger row update (instant 0ms optimistic update)
  const handleUpdateField = async (
    entryId: string,
    payload: Record<string, any>
  ) => {
    try {
      await updateMutation.mutateAsync({
        id: entryId,
        payload,
      });
    } catch {
      // Rejection handled by mutation onError callback (cache rollback & toast)
    }
  };

  // Status cell handler
  const handleStatusChange = async (entry: BulkerEntry, newStatus: BulkerStatus) => {
    if (newStatus === entry.status) return;

    // 1. Block invalid jumps from VRA
    if (entry.status === "VRA") {
      if (newStatus === "SEND") {
        toast.error("Truck must be ALLOCATED to a customer before entering plant (SEND).");
        return;
      }
      if (newStatus === "OUT") {
        toast.error("Cannot mark OUT: Truck in VRA must be Allocated and Sent to plant before departure.");
        return;
      }
    }

    // 2. Block direct jump from ALLOCATED to OUT (must go through SEND)
    if (entry.status === "ALLOCATED") {
      if (newStatus === "OUT") {
        toast.error("Cannot mark OUT directly from ALLOCATED. Truck must first enter the plant (SEND).");
        return;
      }
    }

    // 3. Block leapfrogging from HOLD
    if (entry.status === "HOLD") {
      if (newStatus === "OUT" && !entry.plantInAt) {
        toast.error("Cannot mark OUT from HOLD: Truck never entered the plant (SEND).");
        return;
      }
      if (newStatus === "SEND" && !entry.allocatedAt && !entry.customerName?.trim()) {
        toast.error("Cannot move to SEND from HOLD: Truck must be ALLOCATED first.");
        return;
      }
    }

    // 4. Prerequisites for entering ALLOCATED
    if (newStatus === "ALLOCATED") {
      if (!entry.customerName?.trim() || !entry.destination?.trim()) {
        toast.error("Customer Name and Destination must be set before status can be ALLOCATED.");
        return;
      }
    }

    // 5. Prerequisites for entering SEND
    if (newStatus === "SEND") {
      const missing: string[] = [];
      if (!entry.customerName?.trim()) missing.push("Customer Name");
      if (!entry.destination?.trim()) missing.push("Destination");
      if (!entry.salesOrderNumber?.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        toast.error(
          `Cannot mark SEND: ${missing.join(", ")} must be filled before plant entry.`
        );
        return;
      }
    }

    // 6. Prerequisites for entering OUT
    if (newStatus === "OUT") {
      if (entry.status !== "SEND" && !(entry.status === "HOLD" && entry.plantInAt)) {
        toast.error("Cannot mark OUT: Truck must be in SEND status (inside the plant) before departure.");
        return;
      }

      const missing: string[] = [];
      if (!entry.bulkerNumber?.trim()) missing.push("Bulker Number");
      if (!entry.transporterName?.trim()) missing.push("Transporter");
      if (!entry.permit?.trim()) missing.push("Permit");
      if (!entry.customerName?.trim()) missing.push("Customer Name");
      if (!entry.destination?.trim()) missing.push("Destination");
      if (!entry.salesOrderNumber?.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        toast.error(
          `Cannot mark OUT: ${missing.join(", ")} must be filled before departure.`
        );
        return;
      }
    }

    if (newStatus === "CANCEL") {
      setCancelTargetEntry(entry);
      return;
    }

    const payload: Record<string, any> = { status: newStatus };

    // When status rolls back to VRA: wipe customer, destination, SO number
    if (newStatus === "VRA") {
      payload.customerName = "";
      payload.destination = "";
      payload.salesOrderNumber = null;
    }

    await handleUpdateField(entry.id, payload);
  };

  // Confirm cancellation
  const handleConfirmCancel = async () => {
    if (!cancelTargetEntry) return;
    await handleUpdateField(cancelTargetEntry.id, { status: "CANCEL" });
    setCancelTargetEntry(null);
  };

  // Bulker Autocomplete selection
  const handleSelectBulker = async (entryId: string, bulker: BulkerInfo) => {
    await handleUpdateField(entryId, {
      bulkerNumber: bulker.bulkerNumber,
      transporterName: !bulker.isAllowed ? "NOT ALLOWED" : bulker.transporterName,
      permit: bulker.permit || "",
    });
  };

  // Customer Autocomplete selection
  const handleSelectCustomer = async (entry: BulkerEntry, cust: CustomerInfo) => {
    const payload: Record<string, any> = {
      customerName: cust.customerName,
      destination: cust.destination || "",
    };

    // If currently VRA, auto-transition to ALLOCATED upon customer selection
    if (entry.status === "VRA") {
      payload.status = "ALLOCATED";
    }

    // Auto-fetch latest SO number for this customer
    try {
      const res = await reactQueryFetch<{ salesOrderNumber: string | null }>(
        `/api/bulkerdispatch/customer-latest-so?customerName=${encodeURIComponent(
          cust.customerName
        )}`
      );
      if (res?.salesOrderNumber) {
        payload.salesOrderNumber = res.salesOrderNumber;
      }
    } catch {
      // Non-blocking fallback
    }

    await handleUpdateField(entry.id, payload);
  };

  // Loading state (only shown if there are NO entries loaded yet)
  if (isLoading && entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-[#121316] border border-border/60 rounded-xl">
        <Loader2 className="w-6 h-6 animate-spin text-white mb-2" />
        <p className="text-xs text-muted-foreground">Loading active queue...</p>
      </div>
    );
  }

  // Empty state
  if (entries.length === 0 && !isLoading) {
    return (
      <EmptyState
        icon={<Truck className="w-10 h-10 text-muted-foreground/60" />}
        title={emptyStateTitle || "No Active Bulkers Found"}
        description={
          emptyStateDescription ||
          "No trucks are currently active in the plant or waiting queue."
        }
        action={emptyStateAction}
        className="bg-[#121316] border-border/60 py-24 my-0"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Container exactly matching AdminTable without layout-flashing animations */}
      <div className="w-full bg-[#121316] border border-border/60 rounded-xl overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto no-scrollbar">
          <Table className="w-full min-w-full table-fixed border-collapse">
            <TableHeader className="bg-black/30 border-b border-border/60">
              <TableRow className="hover:bg-transparent border-b border-border/40">
                <TableHead className="border-r border-border/30 w-[60px] text-center text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  S No.
                </TableHead>
                <TableHead className="border-r border-border/30 w-[140px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="border-r border-border/30 w-[160px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Bulker No.
                </TableHead>
                <TableHead className="border-r border-border/30 w-[180px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Transporter
                </TableHead>
                <TableHead className="border-r border-border/30 w-[120px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Permit
                </TableHead>
                <TableHead className="border-r border-border/30 w-[200px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Customer Name
                </TableHead>
                <TableHead className="border-r border-border/30 w-[160px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Destination
                </TableHead>
                <TableHead className="border-r border-border/30 w-[130px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  SO Number
                </TableHead>
                <TableHead className="border-r border-border/30 min-w-[180px] text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap">
                  Remarks
                </TableHead>
                <TableHead className="last:border-r-0 w-[50px] text-center text-xs text-muted-foreground font-semibold py-3 px-2 overflow-hidden text-ellipsis whitespace-nowrap">
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((row) => {
                return (
                  <TableRow
                    key={row.id}
                    className="hover:bg-white/[0.02] border-b border-border/30 last:border-b-0 transition-colors group"
                  >
                    {/* S No. (Strictly Read-Only, no #) */}
                    <TableCell className="border-r border-border/30 py-2 px-3 text-center font-mono text-xs font-semibold text-white overflow-hidden text-ellipsis whitespace-nowrap">
                      {row.serialNumber !== null ? row.serialNumber : "—"}
                    </TableCell>

                    {/* Status Cell (In-line Select, Invisible G-Sheets Style) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      {isViewer ? (
                        <div className="px-2.5 py-1.5 flex items-center">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide",
                              row.status === "VRA" && "bg-sky-500/10 text-sky-400 border border-sky-500/20",
                              row.status === "ALLOCATED" && "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                              row.status === "SEND" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                              row.status === "HOLD" && "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            )}
                          >
                            {row.status}
                          </span>
                        </div>
                      ) : (
                        <Select
                          value={row.status}
                          disabled={isViewer || row.status === "VRA"}
                          onValueChange={(val) => handleStatusChange(row, val as BulkerStatus)}
                        >
                          <SelectTrigger
                            title={
                              row.status === "VRA"
                                ? "Status is VRA. Add Customer & Destination to allocate."
                                : undefined
                            }
                            className={cn(
                              "h-8 text-[11px] font-semibold uppercase px-2.5 bg-transparent border-0 border-transparent shadow-none rounded-none focus:outline-none focus:ring-0 focus:border-0 focus:bg-transparent focus-visible:ring-0 focus-visible:outline-none focus-visible:border-0 hover:bg-transparent transition-colors",
                              row.status === "VRA" && "text-sky-400 opacity-80 cursor-not-allowed",
                              row.status === "ALLOCATED" && "text-amber-400",
                              row.status === "SEND" && "text-emerald-400",
                              row.status === "HOLD" && "text-yellow-400"
                            )}
                          >
                            <SelectValue>{row.status}</SelectValue>
                          </SelectTrigger>
                          <SelectContent className="bg-[#121316] border border-border text-white">
                            {getAvailableNextStatuses(row.status, Boolean(row.plantInAt)).map((s) => (
                              <SelectItem key={s} value={s} className="text-xs uppercase hover:bg-zinc-800">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>

                    {/* Bulker Number Cell (Write In-Cell, Dropdown Suggestions, Double-Click Last Trip) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <BulkerNumberCell
                        row={row}
                        isViewer={isViewer}
                        bulkerInfoList={bulkerInfoList}
                        onSelectBulker={handleSelectBulker}
                        onCommitManual={(id, val) => handleUpdateField(id, { bulkerNumber: val })}
                        onDoubleClick={() => setLastTripEntry(row)}
                      />
                    </TableCell>

                    {/* Transporter Cell (Disabled / Auto-filled from Bulker Master) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="w-full h-8 px-2.5 py-1.5 text-xs text-white truncate flex items-center">
                        {row.transporterName || "—"}
                      </div>
                    </TableCell>

                    {/* Permit Cell (Disabled / Auto-filled from Bulker Master) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="w-full h-8 px-2.5 py-1.5 text-xs text-muted-foreground truncate flex items-center">
                        {row.permit || "—"}
                      </div>
                    </TableCell>

                    {/* Customer Name Cell (Write In-Cell, Dropdown Suggestions) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <CustomerNameCell
                        row={row}
                        isViewer={isViewer}
                        customerInfoList={customerInfoList}
                        onSelectCustomer={handleSelectCustomer}
                        onCommitManual={(id, val) => handleUpdateField(id, { customerName: val })}
                      />
                    </TableCell>

                    {/* Destination Cell (Strictly Read-Only, Auto-filled from Customer) */}
                    <TableCell className="border-r border-border/30 p-0 text-xs text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <div className="w-full h-8 px-2.5 py-1.5 text-xs text-zinc-400 truncate flex items-center">
                        {row.destination || "—"}
                      </div>
                    </TableCell>

                    {/* SO Number Cell (Invisible G-Sheets Style Input) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      {isViewer ? (
                        <div className="px-2.5 py-1.5 font-mono text-xs text-white truncate flex items-center">
                          {row.salesOrderNumber || "—"}
                        </div>
                      ) : (
                        <input
                          type="text"
                          defaultValue={row.salesOrderNumber || ""}
                          placeholder="—"
                          onBlur={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, "");
                            if (val !== (row.salesOrderNumber || "")) {
                              handleUpdateField(row.id, {
                                salesOrderNumber: val ? val : null,
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className={cn(SHEET_INPUT_CLASS, "font-mono")}
                        />
                      )}
                    </TableCell>

                    {/* Remarks Cell (Invisible G-Sheets Style Input) */}
                    <TableCell className="border-r border-border/30 p-0 text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      {isViewer ? (
                        <div
                          className="px-2.5 py-1.5 text-xs text-muted-foreground truncate flex items-center"
                          title={row.remarks || ""}
                        >
                          {row.remarks || "—"}
                        </div>
                      ) : (
                        <input
                          type="text"
                          defaultValue={row.remarks || ""}
                          placeholder="Add note..."
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (row.remarks || "")) {
                              handleUpdateField(row.id, { remarks: val });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          className={cn(SHEET_INPUT_CLASS, "text-zinc-300")}
                        />
                      )}
                    </TableCell>

                    {/* Row Actions */}
                    <TableCell className="last:border-r-0 py-1 px-2 text-center text-sm text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-white"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#121316] border border-border text-white shadow-xl"
                        >
                          {!isViewer && onOpenStatusModal && (
                            <DropdownMenuItem
                              onClick={() => onOpenStatusModal(row)}
                              className="cursor-pointer hover:bg-zinc-800 text-xs text-amber-400 focus:text-amber-400"
                            >
                              <Edit className="mr-2 h-3.5 w-3.5 text-amber-400" />
                              Update Status
                            </DropdownMenuItem>
                          )}
                          {isAdmin && onOpenEditModal && (
                            <DropdownMenuItem
                              onClick={() => onOpenEditModal(row)}
                              className="cursor-pointer hover:bg-zinc-800 text-xs"
                            >
                              <Edit className="mr-2 h-3.5 w-3.5 text-white" />
                              Full Edit & Timestamps
                            </DropdownMenuItem>
                          )}
                          {isAdmin && (
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(row.id)}
                              className="cursor-pointer hover:bg-zinc-800 text-xs text-rose-400 focus:text-rose-400"
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" />
                              Delete Dispatch
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Footer matching AdminTable */}
      {totalItems > 0 && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
            <p>Viewing</p>
            <Select
              value={String(page)}
              onValueChange={(value) => {
                onPageChange?.(Number(value));
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
                  const start = i * limit + 1;
                  const end = Math.min((i + 1) * limit, totalItems || (i + 1) * limit);
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
                  disabled={page <= 1}
                  onClick={() => onPageChange?.(Math.max(1, page - 1))}
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
                  disabled={page >= pageCount}
                  onClick={() => onPageChange?.(Math.min(pageCount, page + 1))}
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

      {/* Last Trip Dialog (Triggered on Bulker Number Double-Click) */}
      <Dialog
        open={Boolean(lastTripEntry)}
        onOpenChange={(open) => !open && setLastTripEntry(null)}
      >
        <DialogContent className="bg-[#121316] border border-border text-white sm:max-w-md p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Truck className="w-4 h-4 text-zinc-400" />
                Last Trip Details
              </span>
              <span className="font-mono text-sm font-bold text-sky-400">
                {lastTripEntry?.bulkerNumber}
              </span>
            </DialogTitle>
          </DialogHeader>

          {lastTripEntry?.previousTrip ? (
            <div className="space-y-3 pt-2 text-xs">
              <div className="bg-black/30 p-3 rounded-lg border border-border/40 space-y-2">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                    Customer Name
                  </span>
                  <div className="font-medium text-white text-sm">
                    {lastTripEntry.previousTrip.customerName || "—"}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                    Destination
                  </span>
                  <div className="text-xs text-zinc-300">
                    {lastTripEntry.previousTrip.destination || "—"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                    SO Number
                  </span>
                  <span className="font-mono text-sm text-white font-medium">
                    {lastTripEntry.previousTrip.salesOrderNumber || "—"}
                  </span>
                </div>

                <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                    Departure Date
                  </span>
                  <span className="text-xs text-zinc-200">
                    {lastTripEntry.previousTrip.plantOutAt
                      ? formatDateTime(lastTripEntry.previousTrip.plantOutAt, "date")
                      : lastTripEntry.previousTrip.orderDate
                      ? formatDateTime(lastTripEntry.previousTrip.orderDate, "date")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-400 text-xs">
              No prior completed trip on record for bulker{" "}
              <strong className="text-white font-mono">
                {lastTripEntry?.bulkerNumber}
              </strong>
              .
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Cancel */}
      <AlertDialog
        open={Boolean(cancelTargetEntry)}
        onOpenChange={(open) => !open && setCancelTargetEntry(null)}
      >
        <AlertDialogContent className="bg-[#121316] border border-border text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              Cancel Dispatch Entry
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-xs leading-relaxed">
              Are you sure you want to cancel dispatch for bulker{" "}
              <strong className="text-white font-mono">
                {cancelTargetEntry?.bulkerNumber}
              </strong>
              ? Once cancelled, this entry is permanently voided and cannot be reactivated.
              Queue serial numbers will decrement automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-border text-white hover:bg-zinc-800 text-xs">
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs"
            >
              Confirm Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
