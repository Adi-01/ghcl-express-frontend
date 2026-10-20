"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cleanupNightCheckingPreviewAction } from "@/app/actions/admin-nightchecking.actions";
import { useCleanupNightCheckingExecuteMutation } from "@/lib/hooks/mutations/useNightCheckingMutations";

interface NightCheckingCleanupModalProps {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
}

export function NightCheckingCleanupModal({
  isOpen,
  onClose,
}: NightCheckingCleanupModalProps) {
  const [cleanupMonth, setCleanupMonth] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const cleanupExecuteMutation = useCleanupNightCheckingExecuteMutation();

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
      const res = await cleanupNightCheckingPreviewAction(cleanupMonth);
      if (res.success && res.data) {
        setPreviewCount(res.data.count);
        toast.info(`Found ${res.data.count} entries for ${cleanupMonth}`);
      } else {
        toast.error(res.error?.message || "Failed to preview cleanup");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to preview cleanup");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleExecute = () => {
    if (!cleanupMonth) return;
    cleanupExecuteMutation.mutate(cleanupMonth, {
      onSuccess: () => {
        onClose(false);
        setPreviewCount(null);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border border-border text-white shadow-2xl rounded-lg">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-lg font-medium text-white flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-rose-400" /> Monthly Night Checking Data Cleanup
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Soft-deletes historical night checking entries for a target month to maintain retention compliance.
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Target Month (YYYY-MM)
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="month"
                value={cleanupMonth}
                onChange={(e) => {
                  setCleanupMonth(e.target.value);
                  setPreviewCount(null);
                }}
                className="bg-black/40 border-border text-white text-xs h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!cleanupMonth || isPreviewing}
                className="h-9 px-3 border-border text-xs text-white hover:bg-zinc-800"
              >
                {isPreviewing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                Dry Run Preview
              </Button>
            </div>
          </div>

          {previewCount !== null && (
            <div className="p-3 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              Target entries to purge:{" "}
              <span className="font-semibold text-rose-400">{previewCount}</span> records
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onClose(false)}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecute}
              disabled={
                previewCount === null ||
                previewCount === 0 ||
                cleanupExecuteMutation.isPending
              }
              className="border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-xs h-9 font-medium"
            >
              {cleanupExecuteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : null}
              Confirm & Purge Month
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

