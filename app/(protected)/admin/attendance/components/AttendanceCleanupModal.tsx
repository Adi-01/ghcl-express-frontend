"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCleanupAttendanceMutation } from "@/lib/hooks/mutations/useAttendanceMutations";

interface AttendanceCleanupModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
}

export function AttendanceCleanupModal({
  isOpen,
  onClose,
}: AttendanceCleanupModalProps) {
  const [cleanupMonth, setCleanupMonth] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const cleanupMutation = useCleanupAttendanceMutation();

  useEffect(() => {
    if (isOpen) {
      setCleanupMonth(new Date().toISOString().slice(0, 7));
      setPreviewCount(null);
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!cleanupMonth) {
      toast.error("Please select a target month.");
      return;
    }
    setIsPreviewing(true);
    try {
      const res = await fetch(`/api/admin/attendance/cleanup_preview?month_str=${cleanupMonth}`);
      if (!res.ok) throw new Error("Failed to preview cleanup");
      const json = await res.json();
      const count = json.data?.count ?? json.count ?? 0;
      setPreviewCount(count);
      toast.info(`Found ${count} attendance records for ${cleanupMonth}`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to preview cleanup");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecute = () => {
    if (!cleanupMonth) return;
    cleanupMutation.mutate(cleanupMonth, {
      onSuccess: () => {
        onClose(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#121316] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-400">
            <Trash2 className="w-5 h-5 text-rose-400" />
            Cleanup Attendance Month Records
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2.5 items-start">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              This operation will soft-delete all attendance shifts for the selected month.
              Please preview record count before executing purge.
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">Target Month (YYYY-MM)</label>
            <div className="flex gap-2">
              <Input
                type="month"
                value={cleanupMonth}
                onChange={(e) => {
                  setCleanupMonth(e.target.value);
                  setPreviewCount(null);
                }}
                className="bg-zinc-900/60 border-white/10 text-white"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPreviewing || !cleanupMonth}
                onClick={handlePreview}
                className="border-white/10 hover:bg-white/5 text-zinc-200"
              >
                {isPreviewing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Preview"
                )}
              </Button>
            </div>
          </div>

          {previewCount !== null && (
            <div className="p-3 bg-zinc-900/60 border border-white/10 rounded-lg text-sm flex items-center justify-between">
              <span className="text-zinc-400">Records to be deleted:</span>
              <span className="font-bold text-rose-400 text-base font-mono">
                {previewCount} records
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              disabled={cleanupMutation.isPending}
              onClick={() => onClose(false)}
              className="border-white/10 hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                cleanupMutation.isPending ||
                previewCount === null ||
                previewCount === 0
              }
              onClick={handleExecute}
              className="bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {cleanupMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Purging Records...
                </>
              ) : (
                `Purge ${previewCount ?? 0} Records`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

