"use client";

import { useState, useRef } from "react";
import { Info, Truck } from "lucide-react";
import type { BulkerEntry, BulkerStatus } from "@/lib/types/bulker";
import { PrevTripModal } from "./PrevTripModal";
import { cn } from "@/lib/utils";

interface BulkerMobileListProps {
  entries: BulkerEntry[];
  isLoading?: boolean;
  isViewer?: boolean;
  startIndex?: number;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateAction?: React.ReactNode;
  canEditEntry?: (entry: BulkerEntry) => boolean;
  onOpenEdit?: (entry: BulkerEntry) => void;
}

const STATUS_COLORS: Record<BulkerStatus, string> = {
  VRA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ALLOCATED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SEND: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  OUT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCEL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function BulkerMobileList({
  entries,
  isLoading = false,
  isViewer = false,
  startIndex = 0,
  emptyStateTitle = "No bulkers found",
  emptyStateDescription = "No trucks currently in queue.",
  emptyStateAction,
  canEditEntry,
  onOpenEdit,
}: BulkerMobileListProps) {
  const [selectedPrevTrip, setSelectedPrevTrip] = useState<BulkerEntry | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  const handleTouchEnd = (entry: BulkerEntry) => {
    const isEditable = !isViewer && onOpenEdit && (canEditEntry ? canEditEntry(entry) : true);
    if (!isEditable) return;

    const now = Date.now();
    const last = lastTapRef.current[entry.id] || 0;
    if (now - last < 350) {
      // Double-tap detected
      onOpenEdit?.(entry);
    }
    lastTapRef.current[entry.id] = now;
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-[#121316] border border-border/50 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center bg-[#121316] border border-border/70 rounded-xl space-y-3">
        <div className="w-10 h-10 rounded-full bg-zinc-800/80 text-zinc-400 mx-auto flex items-center justify-center">
          <Truck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">{emptyStateTitle}</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
            {emptyStateDescription}
          </p>
        </div>
        {emptyStateAction && <div className="pt-2">{emptyStateAction}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const serial = entry.serialNumber ?? startIndex + index + 1;
          const statusStyle =
            STATUS_COLORS[entry.status] ||
            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
          const isEditable =
            !isViewer && onOpenEdit && (canEditEntry ? canEditEntry(entry) : true);

          const customerDisplay = entry.customerName
            ? entry.salesOrderNumber
              ? `${entry.customerName} (${entry.salesOrderNumber})`
              : entry.customerName
            : "—";

          return (
            <div
              key={entry.id}
              onDoubleClick={() => {
                if (isEditable) onOpenEdit?.(entry);
              }}
              onTouchEnd={() => handleTouchEnd(entry)}
              className={cn(
                "p-3 bg-[#121316] border border-border/80 rounded-xl transition-colors select-none space-y-2",
                isEditable
                  ? "active:bg-zinc-900/80 cursor-pointer"
                  : "cursor-default"
              )}
            >
              {/* Row 1: serial number + bulker number + transporter name on left, status on right */}
              <div className="flex items-center justify-between gap-2 text-xs font-medium">
                <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                  <span className="text-zinc-500 shrink-0">#{serial}</span>
                  <span className="text-white shrink-0">{entry.bulkerNumber}</span>
                  {entry.transporterName && (
                    <span className="text-zinc-400 truncate">
                      {entry.transporterName}
                    </span>
                  )}
                </div>

                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                    statusStyle
                  )}
                >
                  {entry.status}
                </span>
              </div>

              {/* Row 2: customername(sonumber) on left, info button on right */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/30 text-xs font-medium">
                <span className="truncate text-zinc-300 min-w-0 flex-1">
                  {customerDisplay}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPrevTrip(entry);
                  }}
                  className="p-1 -mr-1 text-zinc-400 hover:text-sky-400 active:text-sky-300 hover:bg-white/10 rounded-md transition-colors shrink-0"
                  title="View previous trip details"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span className="sr-only">Previous trip details</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev Trip Dialog */}
      <PrevTripModal
        isOpen={Boolean(selectedPrevTrip)}
        onClose={() => setSelectedPrevTrip(null)}
        entry={selectedPrevTrip}
      />
    </>
  );
}

