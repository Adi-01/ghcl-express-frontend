"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Truck } from "lucide-react";
import type { BulkerEntry } from "@/lib/types/bulker";
import { formatDateTime } from "@/lib/utils";

interface PrevTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: BulkerEntry | null;
}

export function PrevTripModal({
  isOpen,
  onClose,
  entry,
}: PrevTripModalProps) {
  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[#121316] border border-border text-white sm:max-w-md p-5 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between border-b border-border/50 pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-zinc-400" />
              Last Trip Details
            </span>
          </DialogTitle>
        </DialogHeader>

        {entry.previousTrip ? (
          <div className="space-y-3 pt-2 text-xs">
            <div className="bg-black/30 p-3 rounded-lg border border-border/40 space-y-2">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Customer Name
                </span>
                <div className="font-medium text-white text-sm">
                  {entry.previousTrip.customerName || "—"}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Destination
                </span>
                <div className="text-xs text-zinc-300">
                  {entry.previousTrip.destination || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  SO Number
                </span>
                <span className="font-mono text-sm text-white font-medium">
                  {entry.previousTrip.salesOrderNumber || "—"}
                </span>
              </div>

              <div className="bg-black/30 p-3 rounded-lg border border-border/40">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                  Departure Date
                </span>
                <span className="text-xs text-zinc-200">
                  {entry.previousTrip.plantOutAt
                    ? formatDateTime(entry.previousTrip.plantOutAt, "date")
                    : entry.previousTrip.orderDate
                    ? formatDateTime(entry.previousTrip.orderDate, "date")
                    : "—"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 text-xs">
            No prior completed trip on record for bulker{" "}
            <strong className="text-white font-mono">
              {entry.bulkerNumber}
            </strong>
            .
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
