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

interface ExportBulkerDataModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
}

export function ExportBulkerDataModal({
  isOpen,
  onClose,
}: ExportBulkerDataModalProps) {
  const [exportType, setExportType] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState("");
  const [monthStr, setMonthStr] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setDate(new Date().toISOString().split("T")[0]);
    setMonthStr(new Date().toISOString().slice(0, 7));
  }, []);


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

      const downloadUrl = `/api/admin/bulkerdispatch/data/export_data?${params.toString()}`;
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error("Failed to export data.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulker_dispatch_${exportType === "daily" ? date : monthStr}.csv`;
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
      <DialogContent className="sm:max-w-md p-6 bg-[#121316] border-[#22242a] text-[#ffffff] shadow-2xl rounded-lg">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-medium tracking-tight text-[#ffffff]">
            Export Dispatch Logs
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
              Export Frequency
            </label>
            <Select
              value={exportType}
              onValueChange={(val) => setExportType(val as "daily" | "monthly")}
            >
              <SelectTrigger className="bg-[#090a0c] border-[#22242a] text-[#ffffff]">
                <SelectValue placeholder="Select Frequency..." />
              </SelectTrigger>
              <SelectContent className="bg-[#121316] border-[#22242a] text-[#ffffff]">
                <SelectItem value="daily" className="hover:bg-[#1c1d22]">
                  Daily Export (Specific Date)
                </SelectItem>
                <SelectItem value="monthly" className="hover:bg-[#1c1d22]">
                  Monthly Export (Full Month)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType === "daily" ? (
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Select Date
              </label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Select date"
                className="w-full bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#8a8f98] uppercase tracking-wider">
                Select Month (YYYY-MM)
              </label>
              <Input
                type="month"
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                className="bg-[#090a0c] border-[#22242a] text-[#ffffff]"
              />
            </div>
          )}

          <div className="pt-2">
            <Button
              onClick={handleDownload}
              className="w-full bg-[#ffffff] text-[#090a0c] hover:bg-[#eaeaea] font-medium transition-colors"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating
                  CSV...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" /> Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
