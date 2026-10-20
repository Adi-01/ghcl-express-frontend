"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import {
  Loader2,
  FileSpreadsheet,
  CalendarIcon,
  FileDown,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/ui/monthpicker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  AttendanceRegisterResponse,
  AttendanceRegisterUser,
} from "@/lib/types/attendance";

interface AttendanceRegisterExportModalProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  initialMonthStr?: string; // YYYY-MM
  initialLocation?: string;
}

const escapeCsvCell = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

export function AttendanceRegisterExportModal({
  isOpen,
  onClose,
  initialMonthStr,
  initialLocation,
}: AttendanceRegisterExportModalProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [location, setLocation] = useState<string>(initialLocation || "");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDate(
        initialMonthStr
          ? new Date(`${initialMonthStr}-01T00:00:00`)
          : new Date()
      );
    }
  }, [isOpen, initialMonthStr]);

  const handleExport = async (formatType: "excel" | "pdf" | "muster") => {
    try {
      if (!date) return;
      setIsExporting(true);

      const monthStr = format(date, "yyyy-MM");
      const params = new URLSearchParams({ month: monthStr });
      if (location && location !== "all") {
        params.append("worklocation", location);
      }

      const res = await fetch(`/api/admin/attendance/register?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch register data");

      const json = await res.json();
      const typedData = (json.data ?? json) as AttendanceRegisterResponse;
      if (!typedData.register || typedData.register.length === 0) {
        toast.error("No register records found for the selected criteria.");
        setIsExporting(false);
        return;
      }

      const dateString = format(date, "MMM-yyyy");
      const locString = location && location !== "all" ? `_${location}` : "";

      if (formatType === "muster") {
        // --- Exact Legacy Muster Roll Data Generation ---
        const headers = [
          "Sr. No",
          "Emp ID",
          "Employee Name",
          "Designation",
          ...typedData.dates.map((d) => format(parseISO(d), "dd")),
          "Working Days",
          "PL",
          "CL",
          "SL",
          "Sunday",
          "Absent",
          "OT",
          "Total",
        ];

        const rows = typedData.register.map(
          (user: AttendanceRegisterUser, index) => {
            const rowData: Record<string, string | number> = {
              sr_no: index + 1,
              emp_id: user.emp_id || user.empId || "-",
              name: user.user_name || user.userName || "Unknown",
              designation: user.designation || "-",
            };

            let extraShifts = 0;

            // Pass 1: Build initial attendance map and count extra shifts
            typedData.dates.forEach((d) => {
              const cell = user.attendance[d];

              if (!cell || cell.count === 0) {
                rowData[`date_${d}`] = "A";
                return;
              }

              // Never display 2P, 3P etc. in muster roll
              rowData[`date_${d}`] = cell.is_working ? "W" : "P";

              if (cell.count > 1) {
                extraShifts += cell.count - 1;
              }
            });

            // Pass 2: Use extra shifts to convert A -> P
            for (const d of typedData.dates) {
              if (extraShifts <= 0) break;

              if (rowData[`date_${d}`] === "A") {
                rowData[`date_${d}`] = "P";
                extraShifts--;
              }
            }

            // Summary columns based on modified data
            const absentCount = typedData.dates.reduce((count, d) => {
              return count + (rowData[`date_${d}`] === "A" ? 1 : 0);
            }, 0);

            rowData.working_days = typedData.dates.length - absentCount;
            rowData.pl = "";
            rowData.cl = "";
            rowData.sl = "";
            rowData.sunday = "";
            rowData.absent = absentCount;
            rowData.ot = "";
            rowData.total = user.total_shifts_worked ?? user.totalShiftsWorked ?? 0;

            return [
              rowData.sr_no,
              rowData.emp_id,
              rowData.name,
              rowData.designation,
              ...typedData.dates.map((d) => rowData[`date_${d}`]),
              rowData.working_days,
              rowData.pl,
              rowData.cl,
              rowData.sl,
              rowData.sunday,
              rowData.absent,
              rowData.ot,
              rowData.total,
            ];
          }
        );

        // Grand Total row for Muster Roll
        const grandTotalShifts = typedData.register.reduce(
          (sum, user) => sum + (user.total_shifts_worked ?? user.totalShiftsWorked ?? 0),
          0
        );

        const gtotalRow = [
          "",
          "",
          "GTOTAL",
          "",
          ...typedData.dates.map(() => ""),
          "",
          "",
          "",
          "",
          "",
          "",
          "",
          grandTotalShifts,
        ];

        rows.push(gtotalRow);

        const finalCsv =
          "\uFEFF" +
          [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((r) => r.map(escapeCsvCell).join(",")),
          ].join("\r\n");

        const link = document.createElement("a");
        const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
        link.href = URL.createObjectURL(blob);
        link.download = `Muster_Roll_${dateString}${locString}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } else {
        // --- Standard Monthly Register Export (Excel / PDF) ---
        const headers = [
          "Name",
          "Total Shifts",
          ...typedData.dates.map((d) => format(parseISO(d), "dd")),
        ];

        const rows = typedData.register.map((user: AttendanceRegisterUser) => {
          const rowData = [
            user.user_name || user.userName || "Unknown",
            String(user.total_shifts_worked ?? user.totalShiftsWorked ?? 0),
          ];

          typedData.dates.forEach((d) => {
            const cell = user.attendance[d];
            if (!cell || cell.count === 0) {
              rowData.push("A");
            } else if (cell.is_working) {
              rowData.push("W");
            } else {
              rowData.push(cell.count > 1 ? `${cell.count}P` : "P");
            }
          });

          return rowData;
        });

        const grandTotalShifts = typedData.register.reduce(
          (sum, user) => sum + (user.total_shifts_worked ?? user.totalShiftsWorked ?? 0),
          0
        );

        rows.push([
          "GTOTAL",
          String(grandTotalShifts),
          ...typedData.dates.map(() => ""),
        ]);

        const finalCsv =
          "\uFEFF" +
          [
            headers.map(escapeCsvCell).join(","),
            ...rows.map((r) => r.map(escapeCsvCell).join(",")),
          ].join("\r\n");

        const link = document.createElement("a");
        const blob = new Blob([finalCsv], { type: "text/csv;charset=utf-8;" });
        link.href = URL.createObjectURL(blob);
        link.download = `Attendance_Register_${dateString}${locString}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }

      onClose(false);
      toast.success(
        formatType === "muster"
          ? "Muster Roll exported successfully."
          : "Register exported successfully."
      );
    } catch (error: any) {
      toast.error(error?.message || "An error occurred while exporting the register.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isExporting && onClose(open)}
    >
      <DialogContent className="sm:max-w-xl p-6 border-border shadow-xl rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Export Register Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Select Month
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
                      format(date, "MMMM yyyy")
                    ) : (
                      <span>Pick a month</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <MonthPicker
                    selectedMonth={date}
                    onMonthSelect={(newDate) => setDate(newDate)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                Location Filter
              </label>
              <Select
                value={location}
                onValueChange={(val) => setLocation(val || "")}
              >
                <SelectTrigger className="w-full bg-transparent">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="GHCL">GHCL</SelectItem>
                  <SelectItem value="Kajli">Kajli</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 w-full sm:justify-between">
            <Button
              variant="outline"
              onClick={() => onClose(false)}
              disabled={isExporting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>

            <div className="flex flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 px-0 sm:px-4"
                onClick={() => handleExport("excel")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Excel</span>
              </Button>

              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 px-0 sm:px-4"
                onClick={() => handleExport("pdf")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">PDF</span>
              </Button>

              <Button
                variant="outline"
                className="flex-1 sm:flex-none border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-900/30 px-0 sm:px-4"
                onClick={() => handleExport("muster")}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 sm:mr-2 animate-spin" />
                ) : (
                  <ClipboardList className="w-4 h-4 sm:mr-2" />
                )}
                <span className="hidden sm:inline">Muster Roll</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
