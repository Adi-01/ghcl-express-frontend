"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Truck, Building2, Calendar, FileText } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import type { BulkerStatus } from "@/lib/types/bulker";

export interface DummyCustomerBulker {
  id: string;
  bulkerNumber: string;
  status: BulkerStatus;
  salesOrderNumber: string | null;
  transporterName: string;
  permit: string;
  destination: string;
  orderDate: string;
  plantOutAt?: string | null;
  remarks?: string;
}

interface BulkerCustomerDetailsModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  customerName: string;
  periodLabel: string;
  bulkers: DummyCustomerBulker[];
}

const STATUS_COLORS: Record<BulkerStatus, string> = {
  VRA: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  ALLOCATED: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  SEND: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  OUT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  HOLD: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CANCEL: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export function BulkerCustomerDetailsModal({
  isOpen,
  onClose,
  customerName,
  periodLabel,
  bulkers,
}: BulkerCustomerDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="bg-[#121316] border border-border text-white sm:max-w-2xl max-h-[85vh] overflow-y-auto p-5 shadow-2xl"
      >
        <DialogHeader className="border-b border-border/50 pb-3">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sky-400 shrink-0" />
              <span className="font-semibold text-base text-white truncate max-w-sm">
                {customerName}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
              <span className="flex items-center gap-1 font-mono">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                {periodLabel}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                {bulkers.length} {bulkers.length === 1 ? "Bulker" : "Bulkers"}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-2.5">
          {bulkers.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              No bulkers assigned to this customer during the selected period.
            </div>
          ) : (
            <div className="space-y-2">
              {bulkers.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="p-3 bg-black/30 border border-border/60 rounded-lg hover:border-zinc-700 transition-colors space-y-2 text-xs"
                >
                  {/* Row 1: Bulker No, Status Badge, SO Number */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-zinc-400" />
                      <span className="font-mono font-bold text-sm text-white">
                        {b.bulkerNumber}
                      </span>
                      {b.permit && (
                        <span className="text-[10px] text-zinc-500 font-mono">
                          ({b.permit})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {b.salesOrderNumber && (
                        <span className="text-[11px] font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded border border-border/40">
                          SO: {b.salesOrderNumber}
                        </span>
                      )}
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                          STATUS_COLORS[b.status] || "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                        )}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Transporter, Destination, Timing */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400 pt-1 border-t border-border/20">
                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">
                        Transporter
                      </span>
                      <span className="text-zinc-300 truncate block font-medium">
                        {b.transporterName || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">
                        Destination
                      </span>
                      <span className="text-zinc-300 truncate block">
                        {b.destination || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-zinc-600 block text-[10px] uppercase">
                        Order / Dep. Time
                      </span>
                      <span className="text-zinc-300 font-mono block">
                        {b.plantOutAt
                          ? formatDateTime(b.plantOutAt)
                          : b.orderDate
                          ? formatDateTime(b.orderDate)
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {b.remarks && (
                    <div className="text-[11px] text-zinc-500 pt-1 italic">
                      Note: {b.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
