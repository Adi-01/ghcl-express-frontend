"use client";

import { useState, useEffect } from "react";
import { Loader2, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface NightCheckingExportModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function NightCheckingExportModal({
  isOpen,
  onClose,
}: NightCheckingExportModalProps) {
  const [exportType, setExportType] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    // Default to current date in IST (Asia/Kolkata)
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    setDate(today);
    setMonthStr(today.slice(0, 7));
  }, [isOpen]);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ export_type: exportType });
      if (exportType === "daily") {
        if (!date) {
          toast.error("Please select a date.");
          setIsExporting(false);
          return;
        }
        params.set("date", date);
      } else {
        if (!monthStr) {
          toast.error("Please select a month (YYYY-MM).");
          setIsExporting(false);
          return;
        }
        params.set("month_str", monthStr);
      }

      const downloadUrl = `/api/admin/nightchecking/entries/export_data?${params.toString()}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error("Failed to export night checking data.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `night_checking_${exportType === "daily" ? date : monthStr}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("CSV file downloaded successfully.");
      onClose(false);
    } catch (err: any) {
      toast.error(err?.message || "Export failed.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border border-border text-white shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-white">
            Export Night Checking Logs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Export Frequency
            </label>
            <Select
              value={exportType}
              onValueChange={(val) => setExportType(val as "daily" | "monthly")}
            >
              <SelectTrigger className="bg-black/40 border-border text-white text-xs h-9">
                <SelectValue placeholder="Select Frequency..." />
              </SelectTrigger>
              <SelectContent className="bg-[#121316] border border-border text-white text-xs">
                <SelectItem value="daily" className="text-xs">
                  Daily Export (Specific Date)
                </SelectItem>
                <SelectItem value="monthly" className="text-xs">
                  Monthly Export (Full Month)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === "daily" ? (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Date
              </label>
              <DatePicker
                value={date}
                onChange={(d) => d && setDate(d)}
                placeholder="Select date"
                clearable={false}
                className="w-full bg-black/40 border-border text-white text-xs"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Month (YYYY-MM)
              </label>
              <Input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                className="bg-black/40 border-border text-white text-xs h-9"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2 border-t border-border/40">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onClose(false)}
              disabled={isExporting}
              className="text-xs text-muted-foreground hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              className="bg-white text-black hover:bg-zinc-200 font-medium text-xs h-9 px-4 transition-colors"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating CSV...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

