"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, LogOut, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmAttendanceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCheckout: boolean;
  isBusy?: boolean;
  location?: string;
  checkInTime?: string | Date | null;
}

function getDuration(from: Date, to: Date) {
  const diff = Math.floor((to.getTime() - from.getTime()) / 1000);
  if (diff <= 0) return "0s";
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ConfirmAttendanceDialog({
  isOpen,
  onClose,
  onConfirm,
  isCheckout,
  isBusy = false,
  location,
  checkInTime,
}: ConfirmAttendanceDialogProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now
    ? now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "--:--:--";

  const dateStr = now
    ? now.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const checkInDate = checkInTime ? new Date(checkInTime) : null;
  const durationStr =
    isCheckout && checkInDate && now ? getDuration(checkInDate, now) : null;

  return (
    <Dialog open={isOpen} onOpenChange={() => !isBusy && onClose()}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-white/10 text-white">
        <DialogHeader>
          <div
            className={cn(
              "mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 border",
              isCheckout
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            )}
          >
            {isCheckout ? (
              <LogOut className="w-7 h-7" />
            ) : (
              <LogIn className="w-7 h-7" />
            )}
          </div>

          <DialogTitle className="text-center text-lg font-bold">
            {isCheckout ? "Confirm Check-Out" : "Confirm Check-In"}
          </DialogTitle>

          <div className="text-center text-sm text-zinc-400 space-y-0.5">
            <p>
              {isCheckout
                ? "Are you sure you want to end your shift?"
                : "Are you sure you want to start your shift?"}
            </p>
            <p className="text-xs text-zinc-500">
              {isCheckout
                ? "क्या आप अपनी शिफ्ट समाप्त करना चाहते हैं?"
                : "क्या आप अपनी शिफ्ट शुरू करना चाहते हैं?"}
            </p>
            <p className="text-xs text-zinc-500">
              {isCheckout
                ? "તમે તમારી શિફ્ટ સમાપ્ત કરવા માંગો છો?"
                : "તમે તમારી શિફ્ટ શરૂ કરવા માંગો છો?"}
            </p>
          </div>
        </DialogHeader>

        {/* Details card */}
        <div className="rounded-lg bg-zinc-900/60 border border-white/5 p-4 space-y-3 my-2 text-sm">
          {location && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-500" /> Location
              </span>
              <span className="font-semibold text-white">{location}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-zinc-500" /> Time
            </span>
            <span className="font-semibold text-white font-mono">{timeStr}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Date</span>
            <span className="text-zinc-300 text-xs">{dateStr}</span>
          </div>

          {durationStr && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-zinc-400 font-medium">Shift Duration</span>
              <span className="font-bold text-emerald-400 font-mono">
                {durationStr}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={onClose}
            className="border-white/10 hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={cn(
              "font-semibold text-white",
              isCheckout
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            )}
          >
            {isBusy ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : isCheckout ? (
              "Yes, Check Out"
            ) : (
              "Yes, Check In"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

