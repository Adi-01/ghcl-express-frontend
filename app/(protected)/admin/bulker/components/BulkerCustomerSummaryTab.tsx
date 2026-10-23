"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableFilterPopover } from "@/components/shared/TableFilterPopover";
import { cn } from "@/lib/utils";
import { useBulkerSummaryQuery } from "@/lib/hooks/queries/useBulkerQuery";
import type { CustomerSummaryItem } from "@/lib/types/bulker";
import { BulkerCustomerDetailsModal } from "./BulkerCustomerDetailsModal";

// Helper to get today in IST (YYYY-MM-DD)
const getTodayIST = (): string => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);
  const yyyy = istDate.getFullYear();
  const MM = String(istDate.getMonth() + 1).padStart(2, "0");
  const dd = String(istDate.getDate()).padStart(2, "0");
  return `${yyyy}-${MM}-${dd}`;
};

// Helper to get current month in IST (YYYY-MM)
const getCurrentMonthIST = (): string => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);
  const yyyy = istDate.getFullYear();
  const MM = String(istDate.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${MM}`;
};

// Dynamically generate the last 12 months in IST
const RECENT_MONTHS = (() => {
  const result: { value: string; label: string }[] = [];
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);

  for (let i = 0; i < 12; i++) {
    const cur = new Date(istDate.getFullYear(), istDate.getMonth() - i, 1);
    const yyyy = cur.getFullYear();
    const MM = String(cur.getMonth() + 1).padStart(2, "0");
    const label = cur.toLocaleString("default", { month: "long", year: "numeric" });
    result.push({ value: `${yyyy}-${MM}`, label });
  }
  return result;
})();

export function BulkerCustomerSummaryTab() {
  // Mode: "date" vs "month"
  const [mode, setMode] = useState<"date" | "month">("date");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthIST());

  // Draft filters for TableFilterPopover
  const [draftMode, setDraftMode] = useState<"date" | "month">("date");
  const [draftDate, setDraftDate] = useState<string>(getTodayIST());
  const [draftMonth, setDraftMonth] = useState<string>(getCurrentMonthIST());

  // Search input state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Drilldown dialog state
  const [drilldownCustomer, setDrilldownCustomer] = useState<CustomerSummaryItem | null>(null);

  // Live Query from Backend via Next.js Route Handler BFF
  const { data, isLoading, isFetching, refetch } = useBulkerSummaryQuery({
    mode,
    date: mode === "date" ? selectedDate : undefined,
    month: mode === "month" ? selectedMonth : undefined,
    search: activeSearch.trim() || undefined,
  });

  const summaryRows = useMemo(() => data?.summary || [], [data]);
  const totals = useMemo(
    () =>
      data?.totals || {
        vraCount: 0,
        allocatedCount: 0,
        sendCount: 0,
        outCount: 0,
        totalCount: 0,
      },
    [data]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const handleApplyFilters = () => {
    setMode(draftMode);
    setSelectedDate(draftDate);
    setSelectedMonth(draftMonth);
  };

  const handleResetFilters = () => {
    setDraftMode("date");
    setDraftDate(getTodayIST());
    setDraftMonth(getCurrentMonthIST());
    setMode("date");
    setSelectedDate(getTodayIST());
    setSelectedMonth(getCurrentMonthIST());
    setSearchInput("");
    setActiveSearch("");
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    refetch();
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (mode === "month") count++;
    if (mode === "date" && selectedDate !== getTodayIST()) count++;
    return count;
  }, [mode, selectedDate]);

  const activePeriodLabel =
    mode === "date"
      ? selectedDate || getTodayIST()
      : RECENT_MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  const isFiltered = Boolean(activeSearch || activeFiltersCount > 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Search and Toolbar - Matches AdminTable exactly */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        {/* 1. Search Form */}
        <form onSubmit={handleSearchSubmit} className="w-56 shrink-0">
          <Input
            placeholder="Search customer name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-black/40 border-border text-white text-xs h-9 w-full"
          />
        </form>

        {/* 2. Refresh Button (Icon-only per design standard) */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          title="Refresh"
          className="shrink-0 bg-black/40 border-border h-9 w-9 text-muted-foreground hover:text-white"
        >
          <RefreshCcw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          <span className="sr-only">Refresh</span>
        </Button>

        {/* 3. Filters Popover (Standard TableFilterPopover) */}
        <TableFilterPopover
          title="Filter Summary"
          activeCount={activeFiltersCount}
          onReset={handleResetFilters}
          onApply={handleApplyFilters}
        >
          <div className="space-y-4">
            {/* View Mode Toggle */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Summary View
              </label>
              <Select
                value={draftMode}
                onValueChange={(val) => setDraftMode(val as "date" | "month")}
              >
                <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="bg-[#121316] border border-border text-white">
                  <SelectItem value="date" className="text-xs">
                    Datewise (Daily)
                  </SelectItem>
                  <SelectItem value="month" className="text-xs">
                    Monthwise (Monthly)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Picker if Datewise */}
            {draftMode === "date" ? (
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dispatch Date (IST)
                </label>
                <DatePicker
                  value={draftDate}
                  onChange={(val) => setDraftDate(val || getTodayIST())}
                  clearable={false}
                  placeholder="Select Date"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="space-y-1.5 flex flex-col">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dispatch Month
                </label>
                <Select
                  value={draftMonth}
                  onValueChange={(val) => setDraftMonth(val)}
                >
                  <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
                    <SelectValue placeholder="Choose Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121316] border border-border text-white">
                    {RECENT_MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TableFilterPopover>

        {/* 4. Active Period Indicator Pill on Toolbar */}
        <div className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-border/60 bg-black/40 text-xs text-muted-foreground font-mono">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-white font-medium">{activePeriodLabel}</span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
            ({mode === "date" ? "Daily" : "Monthly"})
          </span>
        </div>
      </div>

      {/* Main Table or Loading or Empty State - Exactly replicating AdminTable styling */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-[#121316] border border-border/60 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground font-medium">Loading summary...</p>
        </div>
      ) : summaryRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-[#121316] border border-border/60 rounded-xl">
          <div className="mb-3 opacity-60">
            <Building2 className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-white">
            {isFiltered ? "No Matching Customers" : "No Customer Summary Data"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            {isFiltered
              ? "No customers match your active search query or period filter."
              : "No customer dispatch records found for this selected period."}
          </p>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 border-border text-xs text-white hover:bg-zinc-800"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full bg-[#121316] border border-border/60 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
          <div className="w-full overflow-x-auto no-scrollbar">
            <Table className="w-full min-w-full table-fixed border-collapse">
              <TableHeader className="bg-black/30 border-b border-border/60">
                <TableRow className="hover:bg-transparent border-b border-border/40">
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}
                  >
                    Sr.
                  </TableHead>
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap"
                    style={{ width: "260px", minWidth: "260px", maxWidth: "260px" }}
                  >
                    Customer Name
                  </TableHead>
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                  >
                    <span className="text-sky-400">VRA</span>
                  </TableHead>
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                  >
                    <span className="text-amber-400">ALLOCATED</span>
                  </TableHead>
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                  >
                    <span className="text-emerald-400">SEND</span>
                  </TableHead>
                  <TableHead
                    className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                  >
                    <span className="text-zinc-400">OUT</span>
                  </TableHead>
                  <TableHead
                    className="text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                    style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                  >
                    TOTAL
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {summaryRows.map((row, idx) => {
                  const isUnallocated = row.customerName.includes("Unallocated");

                  return (
                    <TableRow
                      key={row.customerName || idx}
                      className="hover:bg-white/[0.02] border-b border-border/30 transition-colors"
                    >
                      {/* Sr. */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3 font-mono text-xs text-muted-foreground text-center"
                        style={{ width: "50px", minWidth: "50px", maxWidth: "50px" }}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </TableCell>

                      {/* Customer Name */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3"
                        style={{ width: "260px", minWidth: "260px", maxWidth: "260px" }}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span
                            className={cn(
                              "font-medium text-xs truncate block max-w-[220px]",
                              isUnallocated ? "text-amber-400 italic" : "text-white"
                            )}
                            title={row.customerName}
                          >
                            {row.customerName}
                          </span>
                        </div>
                      </TableCell>

                      {/* VRA */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3 text-center"
                        style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                      >
                        <span
                          className={cn(
                            "inline-block min-w-6 text-xs font-mono font-medium py-0.5 rounded text-center",
                            row.vraCount > 0
                              ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                              : "text-zinc-600"
                          )}
                        >
                          {row.vraCount}
                        </span>
                      </TableCell>

                      {/* ALLOCATED */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3 text-center"
                        style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                      >
                        <span
                          className={cn(
                            "inline-block min-w-6 text-xs font-mono font-medium py-0.5 rounded text-center",
                            row.allocatedCount > 0
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "text-zinc-600"
                          )}
                        >
                          {row.allocatedCount}
                        </span>
                      </TableCell>

                      {/* SEND */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3 text-center"
                        style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                      >
                        <span
                          className={cn(
                            "inline-block min-w-6 text-xs font-mono font-medium py-0.5 rounded text-center",
                            row.sendCount > 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "text-zinc-600"
                          )}
                        >
                          {row.sendCount}
                        </span>
                      </TableCell>

                      {/* OUT */}
                      <TableCell
                        className="border-r border-border/20 py-2.5 px-3 text-center"
                        style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                      >
                        <span
                          className={cn(
                            "inline-block min-w-6 text-xs font-mono font-medium py-0.5 rounded text-center",
                            row.outCount > 0
                              ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20"
                              : "text-zinc-600"
                          )}
                        >
                          {row.outCount}
                        </span>
                      </TableCell>

                      {/* Interactive TOTAL */}
                      <TableCell
                        className="py-2.5 px-3 text-center"
                        style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                      >
                        <button
                          type="button"
                          onClick={() => setDrilldownCustomer(row)}
                          disabled={row.totalCount === 0}
                          title={`View ${row.totalCount} bulkers for ${row.customerName}`}
                          className={cn(
                            "inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-mono font-bold transition-all border",
                            row.totalCount > 0
                              ? "bg-white/10 hover:bg-white hover:text-black border-white/20 text-white cursor-pointer active:scale-95 shadow-sm"
                              : "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                          )}
                        >
                          {row.totalCount}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {/* Grand Summary Footer Row */}
                <TableRow className="bg-black/50 border-t-2 border-border/80 font-bold hover:bg-black/50">
                  <TableCell
                    colSpan={2}
                    className="border-r border-border/20 py-3 px-3 text-xs font-semibold text-white tracking-wide uppercase"
                  >
                    Total Dispatches
                  </TableCell>
                  <TableCell
                    className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-sky-400 font-bold"
                  >
                    {totals.vraCount}
                  </TableCell>
                  <TableCell
                    className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-amber-400 font-bold"
                  >
                    {totals.allocatedCount}
                  </TableCell>
                  <TableCell
                    className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-emerald-400 font-bold"
                  >
                    {totals.sendCount}
                  </TableCell>
                  <TableCell
                    className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-zinc-300 font-bold"
                  >
                    {totals.outCount}
                  </TableCell>
                  <TableCell className="py-3 px-3 text-center">
                    <span className="inline-block px-3 py-1 rounded bg-white text-black font-mono font-bold text-xs shadow-sm">
                      {totals.totalCount}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Footer count indicator matching AdminTable */}
      {summaryRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-1 px-1 text-xs text-muted-foreground">
          <div>
            Showing <span className="font-medium text-white">{summaryRows.length}</span> {summaryRows.length === 1 ? "customer" : "customers"}
          </div>
          <div className="flex items-center gap-2">
            <span>Aggregate Period Total:</span>
            <span className="font-mono font-bold text-white">{totals.totalCount}</span>
          </div>
        </div>
      )}

      {/* Customer Drill-Down Modal (Card layout preserved with lifecycle timestamps) */}
      {drilldownCustomer && (
        <BulkerCustomerDetailsModal
          isOpen={Boolean(drilldownCustomer)}
          onClose={() => setDrilldownCustomer(null)}
          customerName={drilldownCustomer.customerName}
          periodLabel={activePeriodLabel}
          bulkers={drilldownCustomer.bulkers}
        />
      )}
    </div>
  );
}
