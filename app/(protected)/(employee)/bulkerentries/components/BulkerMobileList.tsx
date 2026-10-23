"use client";

import { useState, useRef } from "react";
import { Info, Truck, Edit3 } from "lucide-react";
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
  onOpenEdit,
}: BulkerMobileListProps) {
  const [selectedPrevTrip, setSelectedPrevTrip] = useState<BulkerEntry | null>(null);
  const lastTapRef = useRef<Record<string, number>>({});

  const handleTouchEnd = (entry: BulkerEntry) => {
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

          return (
            <div
              key={entry.id}
              onDoubleClick={() => onOpenEdit?.(entry)}
              onTouchEnd={() => handleTouchEnd(entry)}
              className="p-3 bg-[#121316] border border-border/80 rounded-xl active:bg-zinc-900/80 transition-colors select-none group space-y-2"
            >
              {/* Top Row: Serial + Bulker No + Prev Trip Info + Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[11px] font-mono font-medium text-zinc-500 shrink-0">
                    #{serial}
                  </span>
                  <span className="font-mono font-bold text-sm text-white truncate tracking-wide">
                    {entry.bulkerNumber}
                  </span>
                  {/* Prev Trip Info Icon (Visible to all roles) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPrevTrip(entry);
                    }}
                    className="p-1 text-zinc-400 hover:text-sky-400 active:text-sky-300 hover:bg-white/10 rounded-md transition-colors shrink-0"
                    title="View previous trip details"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span className="sr-only">Previous trip details</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                      statusStyle
                    )}
                  >
                    {entry.status}
                  </span>

                  {/* Mobile Quick Edit trigger button */}
                  {!isViewer && onOpenEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEdit(entry);
                      }}
                      className="p-1 text-zinc-500 hover:text-white rounded transition-colors"
                      title="Edit bulker entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span className="sr-only">Edit bulker</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Bottom Row: Customer Name */}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/30 text-muted-foreground">
                <div className="truncate min-w-0 flex-1">
                  {entry.customerName ? (
                    <span className="text-zinc-200 font-medium truncate block">
                      {entry.customerName}
                    </span>
                  ) : (
                    <span className="text-zinc-600 italic">No customer allocated</span>
                  )}
                </div>

                <span className="text-[10px] text-zinc-600 font-mono shrink-0 ml-2">
                  Double-tap to edit
                </span>
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
