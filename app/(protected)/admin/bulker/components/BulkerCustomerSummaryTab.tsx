"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  RefreshCcw,
  Loader2,
  Truck,
  Activity,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useBulkerSummaryQuery } from "@/lib/hooks/queries/useBulkerQuery";
import type {
  ActiveCustomerSummaryResponse,
  MonthlyTransporterSummaryResponse,
  CustomerBulkerDetail,
} from "@/lib/types/bulker";
import { BulkerCustomerDetailsModal } from "./BulkerCustomerDetailsModal";

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
  // Top view switcher: "active" vs "transporter_monthly"
  const [viewType, setViewType] = useState<"active" | "transporter_monthly">("active");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthIST());

  // Search input state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Drilldown dialog state
  const [drilldownCustomer, setDrilldownCustomer] = useState<{
    customerName: string;
    bulkers: CustomerBulkerDetail[];
  } | null>(null);

  // Active bulker summary query (unpaginated live queue)
  const activeQuery = useBulkerSummaryQuery<ActiveCustomerSummaryResponse>({
    type: "active",
    search: activeSearch.trim() || undefined,
  });

  // Monthly customer-transporter summary query
  const monthlyQuery = useBulkerSummaryQuery<MonthlyTransporterSummaryResponse>({
    type: "transporter_monthly",
    month: selectedMonth,
    search: activeSearch.trim() || undefined,
  });

  const isLoading = viewType === "active" ? activeQuery.isLoading : monthlyQuery.isLoading;
  const isFetching = viewType === "active" ? activeQuery.isFetching : monthlyQuery.isFetching;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
  };

  const handleRefresh = () => {
    setSearchInput("");
    setActiveSearch("");
    if (viewType === "active") {
      activeQuery.refetch();
    } else {
      monthlyQuery.refetch();
    }
  };

  const selectedMonthLabel =
    RECENT_MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  // Active data
  const activeSummaryRows = useMemo(() => activeQuery.data?.summary || [], [activeQuery.data]);
  const activeTotals = useMemo(
    () =>
      activeQuery.data?.totals || {
        vraCount: 0,
        allocatedCount: 0,
        sendCount: 0,
        holdCount: 0,
        totalCount: 0,
      },
    [activeQuery.data]
  );

  // Monthly data
  const monthlySummaryRows = useMemo(() => monthlyQuery.data?.summary || [], [monthlyQuery.data]);
  const transportersList = useMemo(
    () => monthlyQuery.data?.transportersList || [],
    [monthlyQuery.data]
  );
  const monthlyTotals = useMemo(
    () =>
      monthlyQuery.data?.totals || {
        totalCustomers: 0,
        totalDispatches: 0,
        transporterTotals: {},
      },
    [monthlyQuery.data]
  );

  const isFiltered = Boolean(activeSearch.trim());

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* 1. Sub-Navigation Tabs */}
      <div className="flex items-center">
        <div className="inline-flex rounded-lg bg-black/40 p-1 border border-border/80">
          <button
            type="button"
            onClick={() => setViewType("active")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all",
              viewType === "active"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Active Bulkers</span>
          </button>
          <button
            type="button"
            onClick={() => setViewType("transporter_monthly")}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all",
              viewType === "transporter_monthly"
                ? "bg-white text-black shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Monthly Transporters</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="flex flex-wrap items-center justify-start gap-2">
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="w-56 shrink-0">
          <Input
            placeholder={
              viewType === "active"
                ? "Search customer, bulker..."
                : "Search customer, transporter..."
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="bg-black/40 border-border text-white text-xs h-9 w-full"
          />
        </form>

        {/* Month Picker (Only for Monthly Transporter View) */}
        {viewType === "transporter_monthly" && (
          <Select
            value={selectedMonth}
            onValueChange={(val) => setSelectedMonth(val)}
          >
            <SelectTrigger className="w-44 bg-black/40 border-border text-white text-xs h-9">
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
        )}

        {/* Refresh Button (Icon-only per design standard) */}
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

        
      </div>

      {/* 3. Main Table Display */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 bg-[#121316] border border-border/60 rounded-xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
          <p className="text-xs text-muted-foreground font-medium">
            {viewType === "active"
              ? "Loading active bulkers summary..."
              : "Loading monthly transporter summary..."}
          </p>
        </div>
      ) : viewType === "active" ? (
        /* ========================================================================= */
        /* VIEW 1: ACTIVE BULKER SUMMARY (VRA | ALLOCATED | SEND | HOLD | TOTAL)     */
        /* ========================================================================= */
        activeSummaryRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-[#121316] border border-border/60 rounded-xl">
            <div className="mb-3 opacity-60">
              <Building2 className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-white">
              {isFiltered ? "No Matching Active Customers" : "No Active Bulkers in Plant"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isFiltered
                ? "No active customer records match your search query."
                : "There are currently no bulkers inside the active plant queue."}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-4 border-border text-xs text-white hover:bg-zinc-800"
              >
                Reset Search
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
                      className="sticky left-0 z-30 bg-[#121316] border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-2 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                      style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}
                    >
                      Sr.
                    </TableHead>
                    <TableHead
                      className="sticky left-[48px] z-30 bg-[#121316] border-r border-border/40 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
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
                      <span className="text-purple-400">HOLD</span>
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
                  {activeSummaryRows.map((row, idx) => {
                    const isUnallocated = row.customerName.includes("Unallocated");

                    return (
                      <TableRow
                        key={row.customerName || idx}
                        className="group hover:bg-white/[0.02] border-b border-border/30 transition-colors"
                      >
                        {/* Sr. */}
                        <TableCell
                          className="sticky left-0 z-20 bg-[#121316] group-hover:bg-[#18191d] border-r border-border/20 py-2.5 px-2 font-mono text-xs text-muted-foreground text-center"
                          style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </TableCell>

                        {/* Customer Name */}
                        <TableCell
                          className="sticky left-[48px] z-20 bg-[#121316] group-hover:bg-[#18191d] border-r border-border/40 py-2.5 px-3"
                          style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span
                              className={cn(
                                "font-medium text-xs truncate block max-w-[130px]",
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

                        {/* HOLD */}
                        <TableCell
                          className="border-r border-border/20 py-2.5 px-3 text-center"
                          style={{ width: "90px", minWidth: "90px", maxWidth: "90px" }}
                        >
                          <span
                            className={cn(
                              "inline-block min-w-6 text-xs font-mono font-medium py-0.5 rounded text-center",
                              row.holdCount > 0
                                ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                : "text-zinc-600"
                            )}
                          >
                            {row.holdCount}
                          </span>
                        </TableCell>

                        {/* Interactive TOTAL */}
                        <TableCell
                          className="py-2.5 px-3 text-center"
                          style={{ width: "110px", minWidth: "110px", maxWidth: "110px" }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setDrilldownCustomer({
                                customerName: row.customerName,
                                bulkers: row.bulkers,
                              })
                            }
                            disabled={row.totalCount === 0}
                            title={`View ${row.totalCount} active bulkers for ${row.customerName}`}
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
                      className="sticky left-0 z-20 bg-[#101114] border-r border-border/40 py-3 px-3 text-xs font-semibold text-white tracking-wide uppercase"
                      style={{ width: "218px", minWidth: "218px", maxWidth: "218px" }}
                    >
                      Total Active Dispatches
                    </TableCell>
                    <TableCell className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-sky-400 font-bold">
                      {activeTotals.vraCount}
                    </TableCell>
                    <TableCell className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-amber-400 font-bold">
                      {activeTotals.allocatedCount}
                    </TableCell>
                    <TableCell className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-emerald-400 font-bold">
                      {activeTotals.sendCount}
                    </TableCell>
                    <TableCell className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-purple-400 font-bold">
                      {activeTotals.holdCount}
                    </TableCell>
                    <TableCell className="py-3 px-3 text-center">
                      <span className="inline-block px-3 py-1 rounded bg-white text-black font-mono font-bold text-xs shadow-sm">
                        {activeTotals.totalCount}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )
      ) : (
        /* ========================================================================= */
        /* VIEW 2: MONTHLY CUSTOMER-TRANSPORTER SUMMARY                              */
        /* ========================================================================= */
        monthlySummaryRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-[#121316] border border-border/60 rounded-xl">
            <div className="mb-3 opacity-60">
              <Truck className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <p className="text-sm font-medium text-white">
              {isFiltered
                ? "No Matching Customer-Transporters"
                : `No Dispatches for ${selectedMonthLabel}`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {isFiltered
                ? "No records match your search filter."
                : "There were no recorded customer dispatches during this selected month."}
            </p>
            {isFiltered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="mt-4 border-border text-xs text-white hover:bg-zinc-800"
              >
                Reset Search
              </Button>
            )}
          </div>
        ) : (
          <div className="w-full bg-[#121316] border border-border/60 rounded-xl overflow-hidden shadow-sm animate-in fade-in duration-300">
            <div className="w-full overflow-x-auto">
              <Table className="w-full min-w-full border-collapse">
                <TableHeader className="bg-black/30 border-b border-border/60">
                  <TableRow className="hover:bg-transparent border-b border-border/40">
                    <TableHead
                      className="sticky left-0 z-30 bg-[#121316] border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-2 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                      style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}
                    >
                      Sr.
                    </TableHead>
                    <TableHead
                      className="sticky left-[48px] z-30 bg-[#121316] border-r border-border/40 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
                    >
                      Customer
                    </TableHead>

                    {/* Dynamic Transporter Columns */}
                    {transportersList.map((tName) => (
                      <TableHead
                        key={tName}
                        className="border-r border-border/30 text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                        style={{ minWidth: "120px" }}
                        title={tName}
                      >
                        <span className="truncate block max-w-[150px] mx-auto text-zinc-300">
                          {tName}
                        </span>
                      </TableHead>
                    ))}

                    {/* Customer Total Column T */}
                    <TableHead
                      className="text-xs text-muted-foreground font-semibold py-3 px-3 overflow-hidden text-ellipsis whitespace-nowrap text-center"
                      style={{ width: "80px", minWidth: "80px" }}
                    >
                      T
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {monthlySummaryRows.map((row, idx) => {
                    const isUnallocated = row.customerName.includes("Unallocated");

                    return (
                      <TableRow
                        key={row.customerName || idx}
                        className="group hover:bg-white/[0.02] border-b border-border/30 transition-colors"
                      >
                        {/* Sr. */}
                        <TableCell
                          className="sticky left-0 z-20 bg-[#121316] group-hover:bg-[#18191d] border-r border-border/20 py-2.5 px-2 font-mono text-xs text-muted-foreground text-center"
                          style={{ width: "48px", minWidth: "48px", maxWidth: "48px" }}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </TableCell>

                        {/* Customer */}
                        <TableCell
                          className="sticky left-[48px] z-20 bg-[#121316] group-hover:bg-[#18191d] border-r border-border/40 py-2.5 px-3"
                          style={{ width: "170px", minWidth: "170px", maxWidth: "170px" }}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span
                              className={cn(
                                "font-medium text-xs truncate block max-w-[130px]",
                                isUnallocated ? "text-amber-400 italic" : "text-white"
                              )}
                              title={row.customerName}
                            >
                              {row.customerName}
                            </span>
                          </div>
                        </TableCell>

                        {/* Transporter Columns Matrix */}
                        {transportersList.map((tName) => {
                          const count = row.transporterCounts?.[tName] ?? 0;
                          return (
                            <TableCell
                              key={tName}
                              className="border-r border-border/20 py-2.5 px-3 text-center"
                              style={{ minWidth: "120px" }}
                            >
                              <span
                                className={cn(
                                  "inline-block min-w-6 text-xs font-mono font-medium py-0.5 px-1.5 rounded text-center",
                                  count > 0
                                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                                    : "text-zinc-600"
                                )}
                              >
                                {count}
                              </span>
                            </TableCell>
                          );
                        })}

                        {/* Row Total T Interactive Button */}
                        <TableCell
                          className="py-2.5 px-3 text-center"
                          style={{ width: "80px", minWidth: "80px" }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setDrilldownCustomer({
                                customerName: row.customerName,
                                bulkers: row.bulkers,
                              })
                            }
                            disabled={row.totalCount === 0}
                            title={`View ${row.totalCount} dispatches for ${row.customerName}`}
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

                  {/* Monthly Transporter Totals Footer Row T */}
                  <TableRow className="bg-black/50 border-t-2 border-border/80 font-bold hover:bg-black/50">
                    <TableCell
                      colSpan={2}
                      className="sticky left-0 z-20 bg-[#101114] border-r border-border/40 py-3 px-3 text-xs font-semibold text-white tracking-wide"
                      style={{ width: "218px", minWidth: "218px", maxWidth: "218px" }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-white/10 text-white px-2 py-0.5 rounded border border-white/20">
                          T
                        </span>
                        <span className="text-zinc-300 uppercase tracking-wider text-[11px]">
                          Total
                        </span>
                      </div>
                    </TableCell>

                    {/* Transporter Column Totals */}
                    {transportersList.map((tName) => {
                      const colTotal = monthlyTotals.transporterTotals?.[tName] ?? 0;
                      return (
                        <TableCell
                          key={tName}
                          className="border-r border-border/20 py-3 px-3 text-center text-xs font-mono text-sky-400 font-bold"
                          style={{ minWidth: "120px" }}
                        >
                          {colTotal}
                        </TableCell>
                      );
                    })}

                    {/* Grand Total Dispatches */}
                    <TableCell
                      className="py-3 px-3 text-center"
                      style={{ width: "80px", minWidth: "80px" }}
                    >
                      <span className="inline-block px-3 py-1 rounded bg-white text-black font-mono font-bold text-xs shadow-sm">
                        {monthlyTotals.totalDispatches}
                      </span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )
      )}

      {/* Footer Count Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 py-1 px-1 text-xs text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-medium text-white">
            {viewType === "active" ? activeSummaryRows.length : monthlySummaryRows.length}
          </span>{" "}
          {((viewType === "active" ? activeSummaryRows.length : monthlySummaryRows.length) === 1)
            ? "customer"
            : "customers"}
        </div>
        <div className="flex items-center gap-2">
          <span>
            {viewType === "active" ? "Active Bulkers in Plant:" : "Total Month Dispatches:"}
          </span>
          <span className="font-mono font-bold text-white">
            {viewType === "active" ? activeTotals.totalCount : monthlyTotals.totalDispatches}
          </span>
        </div>
      </div>

      {/* Customer Drill-Down Modal (Card layout with lifecycle timestamps) */}
      {drilldownCustomer && (
        <BulkerCustomerDetailsModal
          isOpen={Boolean(drilldownCustomer)}
          onClose={() => setDrilldownCustomer(null)}
          customerName={drilldownCustomer.customerName}
          periodLabel={
            viewType === "active"
              ? "Live Active Plant Queue"
              : `Dispatches for ${selectedMonthLabel}`
          }
          bulkers={drilldownCustomer.bulkers}
        />
      )}
    </div>
  );
}
