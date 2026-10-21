"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import type { BulkerEntry, UpdateBulkerEntryPayload } from "@/lib/types/bulker";
import { useUpdateBulkerEntryMutation } from "@/lib/hooks/mutations/useBulkerMutations";
import { formatDateTime } from "@/lib/utils";

interface UpdatePlantOutModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  selectedEntry: BulkerEntry | null;
}

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

export function UpdatePlantOutModal({
  isOpen,
  onClose,
  selectedEntry,
}: UpdatePlantOutModalProps) {
  const [plantOutAt, setPlantOutAt] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");

  const updateEntryMutation = useUpdateBulkerEntryMutation();

  useEffect(() => {
    if (selectedEntry && isOpen) {
      setPlantOutAt(formatToInputDateTime(selectedEntry.plantOutAt));
      setRemarks(selectedEntry.remarks || "");
    }
  }, [selectedEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry) return;

    if (!plantOutAt) {
      toast.error("Plant Out time is required.");
      return;
    }

    const outDate = new Date(plantOutAt);

    if (
      selectedEntry.plantInAt &&
      outDate.getTime() < new Date(selectedEntry.plantInAt).getTime()
    ) {
      toast.error("Plant departure (OUT) time cannot precede plant entry time.");
      return;
    }

    if (
      selectedEntry.vraInAt &&
      outDate.getTime() < new Date(selectedEntry.vraInAt).getTime()
    ) {
      toast.error("Plant departure (OUT) time cannot precede VRA entry time.");
      return;
    }

    try {
      const payload: UpdateBulkerEntryPayload = {
        plantOutAt: outDate.toISOString(),
        remarks: remarks.trim(),
      };

      await updateEntryMutation.mutateAsync({
        id: selectedEntry.id,
        payload,
      });

      toast.success("Plant Out timing updated successfully.");
      onClose(false);
    } catch {
      // Handled by mutation onError callback
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-medium tracking-tight text-[#ffffff] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Update Plant Out Timing</span>
            </span>
            {selectedEntry && (
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-white/10 text-white">
                {selectedEntry.bulkerNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {selectedEntry && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Essential Context Summary Card: Truck Number, Customer, Order Date */}
            <div className="p-3.5 rounded-md bg-[#090a0c] border border-[#22242a] space-y-2.5 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Truck Number:</span>
                <span className="text-white font-mono font-semibold">
                  {selectedEntry.bulkerNumber}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Customer:</span>
                <span className="text-white font-medium">
                  {selectedEntry.customerName || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Order Date:</span>
                <span className="text-white font-mono">
                  {formatDateTime(selectedEntry.orderDate, "date")}
                </span>
              </div>
            </div>

            {/* Plant Out Timestamp Edit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                  Plant Out Time (OUT)
                </label>
                <button
                  type="button"
                  onClick={() => setPlantOutAt(getCurrentInputDateTime())}
                  className="text-[10px] text-zinc-400 hover:text-white underline decoration-dotted"
                >
                  Now
                </button>
              </div>
              <Input
                type="datetime-local"
                value={plantOutAt}
                onChange={(e) => setPlantOutAt(e.target.value)}
                required
                className="bg-[#090a0c] border-[#22242a] text-white text-xs h-9"
              />
              <p className="text-[11px] text-zinc-500">
                Order date will automatically update if departure is on a different calendar day.
              </p>
            </div>

            {/* Remarks Edit */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Remarks
              </label>
              <Input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add optional notes..."
                className="bg-[#090a0c] border-[#22242a] text-white text-xs h-9"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
                disabled={updateEntryMutation.isPending || !plantOutAt}
              >
                {updateEntryMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating Timing...
                  </>
                ) : (
                  "Save Plant Out Time"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
