"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  AlertCircle,
  Truck,
  Building2,
  FileSpreadsheet,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type {
  BulkerEntry,
  BulkerInfo,
  BulkerStatus,
  CustomerInfo,
  UpdateBulkerEntryPayload,
} from "@/lib/types/bulker";
import {
  useBulkerInfoQuery,
  useCustomerInfoQuery,
} from "@/lib/hooks/queries/useBulkerQuery";
import { useUpdateBulkerEntryMutation } from "@/lib/hooks/mutations/useBulkerMutations";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { cn } from "@/lib/utils";

interface BulkerMobileEditModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  entry: BulkerEntry | null;
  isViewer?: boolean;
}

const STATUS_COLORS: Record<BulkerStatus, string> = {
  VRA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ALLOCATED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SEND: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  OUT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCEL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const formatToInputDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const MM = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  } catch {
    return "";
  }
};

const getCurrentInputDateTime = (): string => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};

export function BulkerMobileEditModal({
  isOpen,
  onClose,
  entry,
  isViewer = false,
}: BulkerMobileEditModalProps) {
  const { data: bulkerInfoList = [] } = useBulkerInfoQuery();
  const { data: customerInfoList = [] } = useCustomerInfoQuery();
  const updateMutation = useUpdateBulkerEntryMutation();

  // Form states
  const [bulkerNumber, setBulkerNumber] = useState("");
  const [transporterName, setTransporterName] = useState("");
  const [permit, setPermit] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [destination, setDestination] = useState("");
  const [salesOrderNumber, setSalesOrderNumber] = useState("");
  const [status, setStatus] = useState<BulkerStatus>("VRA");
  const [remarks, setRemarks] = useState("");

  // Respected Status Timestamps
  const [vraInAt, setVraInAt] = useState("");
  const [allocatedAt, setAllocatedAt] = useState("");
  const [plantInAt, setPlantInAt] = useState("");
  const [plantOutAt, setPlantOutAt] = useState("");

  // Dropdown Autocomplete visibility
  const [isBulkerDropdownOpen, setIsBulkerDropdownOpen] = useState(false);
  const [isCustDropdownOpen, setIsCustDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bulkerBoxRef = useRef<HTMLDivElement>(null);
  const custBoxRef = useRef<HTMLDivElement>(null);

  // Initialize form on open
  useEffect(() => {
    if (entry && isOpen) {
      setBulkerNumber(entry.bulkerNumber || "");
      setTransporterName(entry.transporterName || "");
      setPermit(entry.permit || "");
      setCustomerName(entry.customerName || "");
      setDestination(entry.destination || "");
      setSalesOrderNumber(entry.salesOrderNumber || "");
      setStatus(entry.status);
      setRemarks(entry.remarks || "");

      setVraInAt(formatToInputDateTime(entry.vraInAt));
      setAllocatedAt(formatToInputDateTime(entry.allocatedAt));
      setPlantInAt(formatToInputDateTime(entry.plantInAt));
      setPlantOutAt(formatToInputDateTime(entry.plantOutAt));

      setErrorMessage(null);
      setIsBulkerDropdownOpen(false);
      setIsCustDropdownOpen(false);
    }
  }, [entry, isOpen]);

  // Handle outside clicks to close autocomplete dropdowns
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (bulkerBoxRef.current && !bulkerBoxRef.current.contains(e.target as Node)) {
        setIsBulkerDropdownOpen(false);
      }
      if (custBoxRef.current && !custBoxRef.current.contains(e.target as Node)) {
        setIsCustDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  // Filtered Bulk Master suggestions
  const filteredBulkers = useMemo(() => {
    if (!bulkerInfoList) return [];
    const q = bulkerNumber.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!q) return bulkerInfoList.slice(0, 8);
    return bulkerInfoList
      .filter((b) =>
        b.bulkerNumber.toUpperCase().replace(/[^A-Z0-9]/g, "").includes(q)
      )
      .slice(0, 8);
  }, [bulkerInfoList, bulkerNumber]);

  // Filtered Customer Master suggestions
  const filteredCustomers = useMemo(() => {
    if (!customerInfoList) return [];
    const q = customerName.trim().toLowerCase();
    if (!q) return customerInfoList.slice(0, 8);
    return customerInfoList
      .filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [customerInfoList, customerName]);

  // Allowed next statuses
  const availableStatuses = useMemo<BulkerStatus[]>(() => {
    if (!entry) return [status];
    switch (entry.status) {
      case "VRA":
        return ["VRA", "ALLOCATED", "HOLD", "CANCEL"];
      case "ALLOCATED":
        return ["ALLOCATED", "SEND", "HOLD", "CANCEL"];
      case "SEND":
        return ["SEND", "OUT", "HOLD", "CANCEL"];
      case "HOLD":
        return entry.plantInAt || plantInAt
          ? ["HOLD", "SEND", "OUT", "CANCEL"]
          : ["HOLD", "ALLOCATED", "SEND", "CANCEL"];
      case "OUT":
        return ["OUT"];
      case "CANCEL":
        return ["CANCEL"];
      default:
        return [entry.status];
    }
  }, [entry, plantInAt, status]);

  // Handle Bulker Selection
  const handleSelectBulker = (b: BulkerInfo) => {
    setBulkerNumber(b.bulkerNumber);
    setTransporterName(!b.isAllowed ? "NOT ALLOWED" : b.transporterName);
    setPermit(b.permit || "");
    setIsBulkerDropdownOpen(false);
    setErrorMessage(null);
  };

  // Handle Customer Selection
  const handleSelectCustomer = async (c: CustomerInfo) => {
    setCustomerName(c.customerName);
    setDestination(c.destination || "");
    setIsCustDropdownOpen(false);
    setErrorMessage(null);

    // If currently VRA, auto-transition to ALLOCATED upon customer selection
    if (status === "VRA") {
      setStatus("ALLOCATED");
      if (!allocatedAt) {
        setAllocatedAt(getCurrentInputDateTime());
      }
    }

    // Auto-fetch latest SO number for this customer
    try {
      const res = await reactQueryFetch<{ salesOrderNumber: string | null }>(
        `/api/bulkerdispatch/customer-latest-so?customerName=${encodeURIComponent(
          c.customerName
        )}`
      );
      if (res?.salesOrderNumber) {
        setSalesOrderNumber(res.salesOrderNumber);
      }
    } catch {
      // Non-blocking
    }
  };

  // Handle Save Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || isViewer || updateMutation.isPending) return;

    setErrorMessage(null);

    const trimmedBulker = bulkerNumber.trim().toUpperCase();
    if (!trimmedBulker) {
      setErrorMessage("Bulker Number cannot be empty.");
      toast.error("Bulker Number cannot be empty.");
      return;
    }

    // 1. Status Transition Validation
    if (status === "ALLOCATED") {
      if (!customerName.trim() || !destination.trim()) {
        const msg = "Customer Name and Destination must be set before status can be ALLOCATED.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    }

    if (status === "SEND") {
      const missing: string[] = [];
      if (!customerName.trim()) missing.push("Customer Name");
      if (!destination.trim()) missing.push("Destination");
      if (!salesOrderNumber.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        const msg = `Cannot mark SEND: ${missing.join(", ")} must be filled before plant entry.`;
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    }

    if (status === "OUT" && entry.status !== "OUT") {
      if (entry.status !== "SEND" && !(entry.status === "HOLD" && entry.plantInAt)) {
        const msg = "Cannot mark OUT: Truck must be in SEND status (inside the plant) before departure.";
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }

      const missing: string[] = [];
      if (!trimmedBulker) missing.push("Bulker Number");
      if (!transporterName.trim()) missing.push("Transporter");
      if (!permit.trim()) missing.push("Permit");
      if (!customerName.trim()) missing.push("Customer Name");
      if (!destination.trim()) missing.push("Destination");
      if (!salesOrderNumber.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        const msg = `Cannot mark OUT: ${missing.join(", ")} must be filled before departure.`;
        setErrorMessage(msg);
        toast.error(msg);
        return;
      }
    }

    // 2. Chronological Sanity Checks for Timestamps
    const vTime = vraInAt ? new Date(vraInAt).getTime() : null;
    const aTime = allocatedAt ? new Date(allocatedAt).getTime() : null;
    const piTime = plantInAt ? new Date(plantInAt).getTime() : null;
    const poTime = plantOutAt ? new Date(plantOutAt).getTime() : null;

    if (vTime && aTime && aTime < vTime) {
      const msg = "Allocation time cannot precede VRA entry time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (aTime && piTime && piTime < aTime) {
      const msg = "Plant entry time cannot precede allocation time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (vTime && piTime && piTime < vTime) {
      const msg = "Plant entry time cannot precede VRA entry time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (piTime && poTime && poTime < piTime) {
      const msg = "Plant departure time cannot precede plant entry time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (aTime && poTime && poTime < aTime) {
      const msg = "Plant departure time cannot precede allocation time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }
    if (vTime && poTime && poTime < vTime) {
      const msg = "Plant departure time cannot precede VRA entry time.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    try {
      const payload: UpdateBulkerEntryPayload = {
        bulkerNumber: trimmedBulker,
        customerName: customerName.trim(),
        destination: destination.trim(),
        salesOrderNumber: salesOrderNumber.trim() || null,
        status,
        remarks: remarks.trim() || undefined,
      };

      if (transporterName.trim()) {
        payload.transporterName = transporterName.trim();
      }
      if (permit.trim()) {
        payload.permit = permit.trim();
      }

      // Rollback to VRA clears customer allocation
      if (status === "VRA") {
        payload.customerName = "";
        payload.destination = "";
        payload.salesOrderNumber = null;
      }

      // Respected status dates
      if (vraInAt) {
        payload.vraInAt = new Date(vraInAt).toISOString();
      }
      if (allocatedAt) {
        payload.allocatedAt = new Date(allocatedAt).toISOString();
      }
      if (plantInAt) {
        payload.plantInAt = new Date(plantInAt).toISOString();
      }
      if (plantOutAt) {
        payload.plantOutAt = new Date(plantOutAt).toISOString();
      }

      await updateMutation.mutateAsync({
        id: entry.id,
        payload,
      });

      toast.success("Bulker entry updated successfully.");
      onClose(false);
    } catch {
      // Rejection handled by mutation
    }
  };

  if (!entry) return null;

  const showAllocatedDate =
    status === "ALLOCATED" ||
    status === "SEND" ||
    status === "HOLD" ||
    status === "OUT" ||
    Boolean(entry.allocatedAt);

  const showPlantInDate =
    status === "SEND" ||
    (status === "HOLD" && (entry.plantInAt || plantInAt)) ||
    status === "OUT" ||
    Boolean(entry.plantInAt);

  const showPlantOutDate = status === "OUT" || Boolean(entry.plantOutAt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#121316] border border-border text-white sm:max-w-md max-h-[90vh] overflow-y-auto p-5 shadow-2xl">
        <DialogHeader className="border-b border-border/50 pb-3">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-white">
                {entry.bulkerNumber}
              </span>
              {entry.serialNumber && (
                <span className="text-[11px] font-mono text-zinc-500">
                  #{entry.serialNumber}
                </span>
              )}
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border",
                STATUS_COLORS[status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              )}
            >
              {status}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {errorMessage && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Bulker Number Field with Autocomplete */}
          <div className="space-y-1.5" ref={bulkerBoxRef}>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Bulker Number</span>
            </Label>
            <div className="relative">
              <Input
                value={bulkerNumber}
                onChange={(e) => {
                  setBulkerNumber(e.target.value.toUpperCase());
                  setIsBulkerDropdownOpen(true);
                  setErrorMessage(null);
                }}
                onFocus={() => setIsBulkerDropdownOpen(true)}
                disabled={isViewer || updateMutation.isPending}
                placeholder="Search or enter bulker..."
                className="font-mono uppercase font-semibold bg-black/40 border-border text-xs h-9 text-white"
              />

              {isBulkerDropdownOpen && !isViewer && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#18191e] border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto p-1 animate-in fade-in">
                  {filteredBulkers.length === 0 ? (
                    <div className="p-2 text-center text-zinc-500 text-[11px]">
                      No matching registered bulkers
                    </div>
                  ) : (
                    filteredBulkers.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectBulker(b);
                        }}
                        className="w-full text-left py-1.5 px-2 hover:bg-white/[0.08] rounded transition-colors flex items-center justify-between"
                      >
                        <span className="font-mono font-medium text-white text-xs">
                          {b.bulkerNumber}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                          {b.transporterName}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Context Summary: Transporter & Permit */}
          <div className="grid grid-cols-2 gap-2 bg-black/20 p-2.5 rounded-lg border border-border/40 text-[11px]">
            <div>
              <span className="text-zinc-500 block">Transporter</span>
              <span className="text-zinc-300 font-medium truncate block">
                {transporterName || "—"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Permit</span>
              <span className="text-zinc-300 font-mono truncate block">
                {permit || "—"}
              </span>
            </div>
          </div>

          {/* Customer Name Field with Autocomplete */}
          <div className="space-y-1.5" ref={custBoxRef}>
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Customer Name</span>
            </Label>
            <div className="relative">
              <Input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setIsCustDropdownOpen(true);
                  setErrorMessage(null);
                }}
                onFocus={() => setIsCustDropdownOpen(true)}
                disabled={isViewer || updateMutation.isPending}
                placeholder="Search or enter customer..."
                className="bg-black/40 border-border text-xs h-9 text-white font-medium"
              />

              {isCustDropdownOpen && !isViewer && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#18191e] border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto p-1 animate-in fade-in">
                  {filteredCustomers.length === 0 ? (
                    <div className="p-2 text-center text-zinc-500 text-[11px]">
                      No matching registered customers
                    </div>
                  ) : (
                    filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectCustomer(c);
                        }}
                        className="w-full text-left py-1.5 px-2 hover:bg-white/[0.08] rounded transition-colors flex items-center justify-between"
                      >
                        <span className="font-medium text-white text-xs truncate max-w-[160px]">
                          {c.customerName}
                        </span>
                        <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">
                          {c.destination}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Destination (Read-only sync) & SO Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Destination</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={isViewer || updateMutation.isPending}
                placeholder="Destination..."
                className="bg-black/40 border-border text-xs h-9 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-400" />
                <span>SO Number</span>
              </Label>
              <Input
                value={salesOrderNumber}
                onChange={(e) => setSalesOrderNumber(e.target.value)}
                disabled={isViewer || updateMutation.isPending}
                placeholder="e.g. 1002345"
                className="font-mono bg-black/40 border-border text-xs h-9 text-white font-medium"
              />
            </div>
          </div>

          {/* Status Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Lifecycle Status</Label>
            <Select
              value={status}
              onValueChange={(val) => {
                const s = val as BulkerStatus;
                setStatus(s);
                setErrorMessage(null);

                // Auto-set timestamps if advancing
                if (s === "ALLOCATED" && !allocatedAt) {
                  setAllocatedAt(getCurrentInputDateTime());
                } else if (s === "SEND" && !plantInAt) {
                  setPlantInAt(getCurrentInputDateTime());
                } else if (s === "OUT" && !plantOutAt) {
                  setPlantOutAt(getCurrentInputDateTime());
                }
              }}
              disabled={isViewer || updateMutation.isPending || entry.status === "CANCEL"}
            >
              <SelectTrigger className="bg-black/40 border-border text-white text-xs h-9">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#121316] border-border text-white">
                {availableStatuses.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs font-medium">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Respected Status Timestamps */}
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Status Timestamps</span>
            </div>

            <div className="space-y-2">
              {/* VRA In Time */}
              <div className="space-y-1">
                <Label className="text-[11px] text-zinc-400">VRA Entry Time</Label>
                <Input
                  type="datetime-local"
                  value={vraInAt}
                  onChange={(e) => {
                    setVraInAt(e.target.value);
                    setErrorMessage(null);
                  }}
                  disabled={isViewer || updateMutation.isPending}
                  className="bg-black/40 border-border text-white text-xs h-8 font-mono"
                />
              </div>

              {/* Allocated Time */}
              {showAllocatedDate && (
                <div className="space-y-1 animate-in fade-in">
                  <Label className="text-[11px] text-zinc-400">Allocation Time</Label>
                  <Input
                    type="datetime-local"
                    value={allocatedAt}
                    onChange={(e) => {
                      setAllocatedAt(e.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={isViewer || updateMutation.isPending}
                    className="bg-black/40 border-border text-white text-xs h-8 font-mono"
                  />
                </div>
              )}

              {/* Plant In Time */}
              {showPlantInDate && (
                <div className="space-y-1 animate-in fade-in">
                  <Label className="text-[11px] text-zinc-400">Plant In Time</Label>
                  <Input
                    type="datetime-local"
                    value={plantInAt}
                    onChange={(e) => {
                      setPlantInAt(e.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={isViewer || updateMutation.isPending}
                    className="bg-black/40 border-border text-white text-xs h-8 font-mono"
                  />
                </div>
              )}

              {/* Plant Out Time */}
              {showPlantOutDate && (
                <div className="space-y-1 animate-in fade-in">
                  <Label className="text-[11px] text-zinc-400">Plant Out Time</Label>
                  <Input
                    type="datetime-local"
                    value={plantOutAt}
                    onChange={(e) => {
                      setPlantOutAt(e.target.value);
                      setErrorMessage(null);
                    }}
                    disabled={isViewer || updateMutation.isPending}
                    className="bg-black/40 border-border text-white text-xs h-8 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs text-muted-foreground">Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isViewer || updateMutation.isPending}
              placeholder="Operational notes..."
              className="bg-black/40 border-border text-xs h-9 text-white"
            />
          </div>

          <DialogFooter className="pt-3 border-t border-border/40 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              disabled={updateMutation.isPending}
              className="border-border text-xs h-9"
            >
              Cancel
            </Button>
            {!isViewer && (
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="gap-2 bg-white text-black hover:bg-zinc-200 text-xs h-9 font-medium"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
