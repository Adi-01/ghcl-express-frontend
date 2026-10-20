"use client";

import { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { Loader2, FileSpreadsheet, CalendarIcon, FileDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AttendanceLogsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helpers matching legacy export
const getShiftTypeLabel = (inTimeStr?: string | null, outTimeStr?: string | null) => {
  if (!outTimeStr) return "Active";
  try {
    if (isSameDay(parseISO(inTimeStr!), parseISO(outTimeStr))) return "Day";
    return "Night";
  } catch {
    return "Shift";
  }
};

const formatTimeForExport = (isoString?: string | null) => {
  if (!isoString) return "-";
  try {
    return format(parseISO(isoString), "dd-MMM-yyyy hh:mm a");
  } catch {
    return isoString;
  }
};

const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const escapeCsvCell = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

export function AttendanceLogsExportModal({
  isOpen,
  onClose,
}: AttendanceLogsExportModalProps) {
  const [exportType, setExportType] = useState<"daily" | "monthly">("daily");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(new Date());
    }
  }, [isOpen]);

  const handleExport = async (formatType: "excel" | "pdf") => {
    try {
      if (!date) return;
      setIsExporting(true);

      const formattedDate =
        exportType === "daily"
          ? format(date, "yyyy-MM-dd")
          : format(date, "yyyy-MM");

      const params = new URLSearchParams();
      if (exportType === "daily") {
        params.set("date", formattedDate);
      } else {
        params.set("month", formattedDate);
      }

      if (location && location !== "all") {
        params.set("worklocation", location);
      }

      const res = await fetch(`/api/admin/attendance/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const rawCsv = await res.text();
      const lines = rawCsv.trim().split(/\r?\n/).filter(Boolean);

      if (lines.length <= 1) {
        toast.error("No records found for the selected time period.");
        setIsExporting(false);
        return;
      }

      // Legacy columns: Employee, Work Location, Check-In, Check-Out, Shift
      const exportHeaders = ["Employee", "Work Location", "Check-In", "Check-Out", "Shift"];
      const exportRows: string[][] = [];

      // Parse backend CSV rows (skip header row 0)
      for (let i = 1; i < lines.length; i++) {
        const row = parseCsvLine(lines[i]!);
        // Backend headers: ID(0), User Name(1), Date(2), Location(3), Check In Time(4), Check Out Time(5), Duration(6)
        const userName = row[1] || "Unknown";
        const loc = row[3] || "";
        const rawIn = row[4] || "";
        const rawOut = row[5] || "";

        exportRows.push([
          userName,
          loc,
          formatTimeForExport(rawIn),
          formatTimeForExport(rawOut),
          getShiftTypeLabel(rawIn, rawOut),
        ]);
      }

      const dateString =
        exportType === "daily"
          ? format(date, "dd-MMM-yyyy")
          : format(date, "MMM-yyyy");

      const locString = location && location !== "all" ? `_${location}` : "";
      const filename = `Attendance_Export_${dateString}${locString}.${formatType === "excel" ? "csv" : "csv"}`;

      const finalCsv =
        "\uFEFF" +
        [
          exportHeaders.map(escapeCsvCell).join(","),
          ...exportRows.map((r) => r.map(escapeCsvCell).join(",")),
        ].join("\r\n");

      const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Attendance logs exported successfully.");
      onClose();
    } catch (error: any) {
      toast.error(error?.message || "Failed to export attendance logs.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isExporting && onClose()}>
      <DialogContent className="sm:max-w-md p-6 border-border shadow-xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Export Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setExportType("daily")}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-all",
                exportType === "daily"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Daily Report
            </button>
            <button
              type="button"
              onClick={() => setExportType("monthly")}
              className={cn(
                "flex-1 text-sm font-medium py-1.5 rounded-md transition-all",
                exportType === "monthly"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly Report
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Location
              </label>
              <Select
                value={location}
                onValueChange={(val) => setLocation(val || "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="GHCL">GHCL</SelectItem>
                  <SelectItem value="Kajli">Kajli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-muted-foreground text-sm font-medium">
                Select {exportType === "daily" ? "Date" : "Month"}
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-transparent",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(
                        date,
                        exportType === "daily" ? "PPP" : "MMMM yyyy"
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {exportType === "daily" ? (
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(newDate) => newDate && setDate(newDate)}
                      autoFocus
                    />
                  ) : (
                    <MonthPicker
                      selectedMonth={date}
                      onMonthSelect={(newDate) => setDate(newDate)}
                    />
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 mt-4 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
              className="w-full sm:w-auto sm:mr-auto"
            >
              Cancel
            </Button>

            <div className="grid grid-cols-2 sm:flex sm:w-auto gap-2 sm:gap-3 w-full">
              <Button
                variant="outline"
                className="w-full sm:w-auto border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                onClick={() => handleExport("excel")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                )}
                Excel
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 mr-2" />
                )}
                PDF
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
