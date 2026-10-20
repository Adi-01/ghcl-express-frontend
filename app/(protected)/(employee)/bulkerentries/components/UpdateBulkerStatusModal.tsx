"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import type { BulkerEntry, BulkerStatus } from "@/lib/types/bulker";
import { useUpdateBulkerStatusMutation } from "@/lib/hooks/mutations/useBulkerMutations";

interface UpdateBulkerStatusModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedEntry: BulkerEntry | null;
  isAdmin?: boolean;
}

const STATUS_TIER: Record<BulkerStatus, number> = {
  VRA: 1,
  ALLOCATED: 2,
  SEND: 3,
  OUT: 4,
  HOLD: 0,
  CANCEL: -1,
};

const ADMIN_STATUSES: BulkerStatus[] = ["VRA", "ALLOCATED", "SEND", "OUT", "HOLD", "CANCEL"];

export function UpdateBulkerStatusModal({
  isOpen,
  onClose,
  selectedEntry,
  isAdmin = false,
}: UpdateBulkerStatusModalProps) {
  const [status, setStatus] = useState<BulkerStatus | "">("");
  const updateStatusMutation = useUpdateBulkerStatusMutation();

  const isCancelled = selectedEntry?.status === "CANCEL";
  const isVRA = selectedEntry?.status === "VRA";

  const allowedStatuses = useMemo<BulkerStatus[]>(() => {
    if (isAdmin) return ADMIN_STATUSES;
    if (!selectedEntry) return [];

    switch (selectedEntry.status) {
      case "VRA":
        return ["VRA"];
      case "ALLOCATED":
        return ["ALLOCATED", "SEND", "HOLD", "CANCEL"];
      case "SEND":
        return ["SEND", "OUT", "HOLD", "CANCEL"];
      case "HOLD":
        return selectedEntry.plantInAt
          ? ["HOLD", "SEND", "OUT", "CANCEL"]
          : ["HOLD", "ALLOCATED", "SEND", "CANCEL"];
      case "OUT":
        return ["OUT"];
      case "CANCEL":
        return ["CANCEL"];
      default:
        return [selectedEntry.status];
    }
  }, [isAdmin, selectedEntry]);

  useEffect(() => {
    if (selectedEntry && isOpen) {
      if (allowedStatuses.includes(selectedEntry.status)) {
        setStatus(selectedEntry.status);
      } else {
        setStatus("");
      }
    }
  }, [selectedEntry, isOpen, allowedStatuses]);

  // Rollback detection
  const rollbackWarning = useMemo(() => {
    if (!selectedEntry || !status) return null;
    const oldTier = STATUS_TIER[selectedEntry.status] ?? 0;
    const newTier = STATUS_TIER[status as BulkerStatus] ?? 0;

    if (oldTier > 0 && newTier > 0 && newTier < oldTier) {
      if (newTier === 1) {
        return "Rolling back to VRA will automatically reset Customer Allocation, Plant In, and Plant Out timestamps upon saving.";
      }
      if (newTier === 2) {
        return "Rolling back to ALLOCATED will automatically reset Plant In and Plant Out timestamps upon saving.";
      }
      if (newTier === 3) {
        return "Rolling back to SEND will automatically reset Plant Out timestamp upon saving.";
      }
    }
    return null;
  }, [selectedEntry, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status || !selectedEntry || isCancelled) return;

    // 1. Block invalid jumps from VRA
    if (selectedEntry.status === "VRA") {
      if (status === "SEND") {
        toast.error("Truck must be ALLOCATED to a customer before entering plant (SEND).");
        return;
      }
      if (status === "OUT") {
        toast.error("Cannot mark OUT: Truck in VRA must be Allocated and Sent to plant before departure.");
        return;
      }
    }

    // 2. Block direct jump from ALLOCATED to OUT
    if (selectedEntry.status === "ALLOCATED") {
      if (status === "OUT") {
        toast.error("Cannot mark OUT directly from ALLOCATED. Truck must first enter the plant (SEND).");
        return;
      }
    }

    // 3. Block leapfrogging from HOLD
    if (selectedEntry.status === "HOLD") {
      if (status === "OUT" && !selectedEntry.plantInAt) {
        toast.error("Cannot mark OUT from HOLD: Truck never entered the plant (SEND).");
        return;
      }
      if (status === "SEND" && !selectedEntry.allocatedAt && !selectedEntry.customerName?.trim()) {
        toast.error("Cannot move to SEND from HOLD: Truck must be ALLOCATED first.");
        return;
      }
    }

    // 4. Prerequisites for entering ALLOCATED
    if (status === "ALLOCATED") {
      if (!selectedEntry.customerName?.trim() || !selectedEntry.destination?.trim()) {
        toast.error("Customer Name and Destination must be set before status can be ALLOCATED.");
        return;
      }
    }

    // 5. Prerequisites for entering SEND
    if (status === "SEND") {
      const missing: string[] = [];
      if (!selectedEntry.customerName?.trim()) missing.push("Customer Name");
      if (!selectedEntry.destination?.trim()) missing.push("Destination");
      if (!selectedEntry.salesOrderNumber?.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        toast.error(
          `Cannot mark SEND: ${missing.join(", ")} must be filled before plant entry.`
        );
        return;
      }
    }

    // 6. Prerequisites for entering OUT
    if (status === "OUT") {
      if (selectedEntry.status !== "SEND" && !(selectedEntry.status === "HOLD" && selectedEntry.plantInAt)) {
        toast.error("Cannot mark OUT: Truck must be in SEND status (inside the plant) before departure.");
        return;
      }

      const missing: string[] = [];
      if (!selectedEntry.bulkerNumber?.trim()) missing.push("Bulker Number");
      if (!selectedEntry.transporterName?.trim()) missing.push("Transporter");
      if (!selectedEntry.permit?.trim()) missing.push("Permit");
      if (!selectedEntry.customerName?.trim()) missing.push("Customer Name");
      if (!selectedEntry.destination?.trim()) missing.push("Destination");
      if (!selectedEntry.salesOrderNumber?.trim()) missing.push("SO Number");

      if (missing.length > 0) {
        toast.error(
          `Cannot mark OUT: ${missing.join(", ")} must be filled before departure.`
        );
        return;
      }
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: selectedEntry.id,
        status: status as BulkerStatus,
      });

      onClose(false);
    } catch {
      // Rejection handled by mutation onError callback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm p-6 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-lg font-medium tracking-tight text-[#ffffff] flex items-center justify-between">
            <span>Update Status</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-normal uppercase bg-zinc-800 text-zinc-300 border border-border">
              {selectedEntry?.status}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isCancelled ? (
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>
                <strong>Cancelled Dispatch:</strong> Cancelled dispatches cannot be reactivated. A new entry must be created.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose(false)}
              className="w-full border-border text-white hover:bg-zinc-800 text-xs"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isVRA && !isAdmin && (
              <div className="p-3 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-sky-400" />
                <div>
                  <span className="font-semibold">VRA Status Locked:</span> Select or enter Customer Name and Destination on the sheet to automatically flip status to ALLOCATED. Manual status change is disabled for VRA.
                </div>
              </div>
            )}

            {rollbackWarning && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <span className="font-semibold">Automatic Rollback:</span> {rollbackWarning}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Target Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as BulkerStatus)}
                disabled={isVRA && !isAdmin}
                required
              >
                <SelectTrigger className="bg-[#090a0c] border-[#22242a] text-[#ffffff] disabled:opacity-50">
                  <SelectValue placeholder="Select Status..." />
                </SelectTrigger>
                <SelectContent className="bg-[#121316] border-[#22242a] text-[#ffffff]">
                  {allowedStatuses.map((s) => (
                    <SelectItem key={s} value={s} className="hover:bg-[#1c1d22]">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
                disabled={updateStatusMutation.isPending || !status || (isVRA && !isAdmin)}
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Status"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
