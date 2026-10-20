"use client";

import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { Loader2, RefreshCcw, UsersRound, FileSpreadsheet } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/lib/types/attendance";
import { useAttendanceRegisterQuery } from "@/lib/hooks/queries/useAttendanceQuery";
import { QUERY_KEYS } from "@/lib/constants";
import { EmptyState } from "@/components/shared/EmptyState";
import { AttendanceRegisterExportModal } from "./AttendanceRegisterExportModal";

export function AttendanceRegisterTab() {
  const queryClient = useQueryClient();

  const [monthInput, setMonthInput] = useState("");

  useEffect(() => {
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());
    setMonthInput(today);
  }, []);

  const [activeLocationFilter, setActiveLocationFilter] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const backendMonthStr = monthInput
    ? format(parse(monthInput, "yyyy-MM", new Date()), "yyyy-MM")
    : undefined;

  const { data, isLoading, isFetching } = useAttendanceRegisterQuery(
    backendMonthStr,
    activeLocationFilter
  );
  const typedData = data as AttendanceRegisterResponse | undefined;

  const grandTotalShifts =
    typedData?.register?.reduce(
      (sum, user) => sum + (user.total_shifts_worked ?? user.totalShiftsWorked ?? 0),
      0
    ) || 0;

  const displayMonth = backendMonthStr
    ? format(parse(backendMonthStr, "yyyy-MM", new Date()), "MMMM yyyy")
    : "";

  const renderAttendanceCell = (cellData?: {
    count: number;
    is_working: boolean;
  }) => {
    if (!cellData || cellData.count === 0) {
      return (
        <div className="flex items-center justify-center w-full h-full text-red-500 font-medium">
          A
        </div>
      );
    }
    if (cellData.is_working) {
      return (
        <div
          className="flex items-center justify-center w-full h-full text-blue-500 font-medium animate-pulse"
          title="Currently Working"
        >
          W
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-full h-full text-emerald-500 font-medium">
        {cellData.count > 1 ? `${cellData.count}P` : "P"}
      </div>
    );
  };

  const refreshPage = async () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.attendance.all,
    });
  };

  const dates = typedData?.dates || [];
  const registerUsers = typedData?.register || [];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">

      {/* Controls Toolbar Section */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        <Select
          value={activeLocationFilter || "All"}
          onValueChange={(val) =>
            setActiveLocationFilter(val === "All" ? "" : val || "")
          }
        >
          <SelectTrigger className="bg-muted/50 w-fit min-w-[120px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="GHCL">GHCL</SelectItem>
            <SelectItem value="Kajli">Kajli</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="month"
          value={monthInput}
          onChange={(e) => setMonthInput(e.target.value)}
          className="w-48 bg-muted/50 shrink-0"
        />

        <Button
          variant="outline"
          onClick={refreshPage}
          title="Refresh Data"
          disabled={isFetching}
          className="w-10 px-0 bg-muted/50 shrink-0"
        >
          <RefreshCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
        </Button>

        <Button
          variant="outline"
          onClick={() => setIsExportModalOpen(true)}
          className="w-10 px-0 bg-muted/50 shrink-0"
          title="Export Register"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-card border rounded-xl shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">
            Calculating monthly matrix...
          </p>
        </div>
      ) : !typedData ||
        !typedData.register ||
        typedData.register.length === 0 ? (
        <EmptyState
          icon={<UsersRound className="w-12 h-12" />}
          title="No Employees Found"
          description={`There are no active attendance records for ${activeLocationFilter || "any location"} in ${displayMonth}.`}
        />
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center text-muted-foreground text-sm font-medium pl-1">
            <span>
              Total {activeLocationFilter ? activeLocationFilter : ""} Shifts
              for {displayMonth}:
            </span>
            <span className="font-semibold text-foreground ml-1">
              {grandTotalShifts}
            </span>
          </div>

          <div className="bg-card border rounded-sm shadow-sm overflow-hidden relative">
            <div className="overflow-x-auto max-h-[70vh]">
              <Table className="table-fixed min-w-max border-collapse">
                <TableHeader className="bg-muted/50 sticky top-0 z-20 shadow-sm">
                  <TableRow>
                    <TableHead className="border-r w-40 sticky left-0 bg-muted/95 backdrop-blur-sm z-30">
                      Employee Name
                    </TableHead>
                    <TableHead className="border-r w-15 text-center">
                      Shift
                    </TableHead>
                    {dates.map((dateStr) => {
                      const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date());
                      return (
                        <TableHead
                          key={dateStr}
                          className="border-r w-[45px] px-1 text-center"
                        >
                          <div className="text-center text-[10px] leading-tight">
                            {format(parsedDate, "dd")}
                            <br />
                            <span className="text-muted-foreground font-normal">
                              {format(parsedDate, "EEE")}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {registerUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/30">
                      <TableCell className="border-r font-semibold truncate sticky left-0 bg-card z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                        {user.user_name || user.userName}
                      </TableCell>
                      <TableCell className="border-r text-center font-bold text-muted-foreground">
                        {user.total_shifts_worked ?? user.totalShiftsWorked ?? 0}
                      </TableCell>
                      {dates.map((dateStr) => (
                        <TableCell
                          key={dateStr}
                          className="border-r p-0 text-center align-middle w-10 h-10"
                        >
                          {renderAttendanceCell(user.attendance[dateStr])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      <AttendanceRegisterExportModal
        isOpen={isExportModalOpen}
        onClose={setIsExportModalOpen}
        initialMonthStr={backendMonthStr}
        initialLocation={activeLocationFilter}
      />
    </div>
  );
}
