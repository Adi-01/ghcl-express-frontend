"use client";

import { useState, useMemo } from "react";
import {
  Calendar,
  Building2,
  Search,
  RotateCcw,
  BarChart3,
  ExternalLink,
  ChevronRight,
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
import { cn } from "@/lib/utils";
import {
  BulkerCustomerDetailsModal,
  type DummyCustomerBulker,
} from "./BulkerCustomerDetailsModal";
import type { BulkerStatus } from "@/lib/types/bulker";

interface CustomerSummaryRow {
  customerName: string;
  vraCount: number;
  allocatedCount: number;
  sendCount: number;
  outCount: number;
  totalCount: number;
  bulkers: DummyCustomerBulker[];
}

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

// Helper to get current month (YYYY-MM)
const getCurrentMonthIST = (): string => {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 5.5 * 3600000);
  const yyyy = istDate.getFullYear();
  const MM = String(istDate.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${MM}`;
};

// Generates 12 past months for dropdown
const RECENT_MONTHS = [
  { value: "2026-10", label: "October 2026" },
  { value: "2026-09", label: "September 2026" },
  { value: "2026-08", label: "August 2026" },
  { value: "2026-07", label: "July 2026" },
  { value: "2026-06", label: "June 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
];

// Rich realistic dummy data representing actual factory dispatches
const DUMMY_SUMMARY_DATA: CustomerSummaryRow[] = [
  {
    customerName: "Borosil Limited",
    vraCount: 0,
    allocatedCount: 1,
    sendCount: 0,
    outCount: 2,
    totalCount: 3,
    bulkers: [
      {
        id: "b-1",
        bulkerNumber: "GJ12AZ1042",
        status: "ALLOCATED",
        salesOrderNumber: "204891",
        transporterName: "Shreeji Logistics",
        permit: "PM-9812",
        destination: "Bharuch Plant",
        orderDate: "2026-10-23T06:30:00.000Z",
      },
      {
        id: "b-2",
        bulkerNumber: "GJ12BW5591",
        status: "OUT",
        salesOrderNumber: "204880",
        transporterName: "Mahalaxmi Transport",
        permit: "PM-4412",
        destination: "Bharuch Plant",
        orderDate: "2026-10-23T04:15:00.000Z",
        plantOutAt: "2026-10-23T09:45:00.000Z",
      },
      {
        id: "b-3",
        bulkerNumber: "GJ01XY8821",
        status: "OUT",
        salesOrderNumber: "204875",
        transporterName: "Shreeji Logistics",
        permit: "PM-3301",
        destination: "Bharuch Plant",
        orderDate: "2026-10-23T03:00:00.000Z",
        plantOutAt: "2026-10-23T08:20:00.000Z",
      },
    ],
  },
  {
    customerName: "Gujarat Guardian Ltd",
    vraCount: 0,
    allocatedCount: 2,
    sendCount: 1,
    outCount: 4,
    totalCount: 7,
    bulkers: [
      {
        id: "b-4",
        bulkerNumber: "GJ12CX2091",
        status: "ALLOCATED",
        salesOrderNumber: "204910",
        transporterName: "Patel Roadways",
        permit: "PM-7721",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T07:10:00.000Z",
      },
      {
        id: "b-5",
        bulkerNumber: "GJ03AB1144",
        status: "ALLOCATED",
        salesOrderNumber: "204911",
        transporterName: "Patel Roadways",
        permit: "PM-7722",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T07:45:00.000Z",
      },
      {
        id: "b-6",
        bulkerNumber: "GJ12DY4412",
        status: "SEND",
        salesOrderNumber: "204899",
        transporterName: "Shreeji Logistics",
        permit: "PM-9844",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T05:30:00.000Z",
      },
      {
        id: "b-7",
        bulkerNumber: "MH04JK9901",
        status: "OUT",
        salesOrderNumber: "204860",
        transporterName: "Jai Bharat Transport",
        permit: "PM-1299",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T02:00:00.000Z",
        plantOutAt: "2026-10-23T07:30:00.000Z",
      },
      {
        id: "b-8",
        bulkerNumber: "GJ12EF3309",
        status: "OUT",
        salesOrderNumber: "204862",
        transporterName: "Patel Roadways",
        permit: "PM-7710",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T02:40:00.000Z",
        plantOutAt: "2026-10-23T08:15:00.000Z",
      },
      {
        id: "b-9",
        bulkerNumber: "GJ12GH7721",
        status: "OUT",
        salesOrderNumber: "204863",
        transporterName: "Shreeji Logistics",
        permit: "PM-9820",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T03:10:00.000Z",
        plantOutAt: "2026-10-23T08:50:00.000Z",
      },
      {
        id: "b-10",
        bulkerNumber: "GJ01MN5502",
        status: "OUT",
        salesOrderNumber: "204865",
        transporterName: "Jai Bharat Transport",
        permit: "PM-1301",
        destination: "Ankleshwar",
        orderDate: "2026-10-23T03:50:00.000Z",
        plantOutAt: "2026-10-23T09:10:00.000Z",
      },
    ],
  },
  {
    customerName: "Saint-Gobain India Pvt Ltd",
    vraCount: 0,
    allocatedCount: 0,
    sendCount: 2,
    outCount: 3,
    totalCount: 5,
    bulkers: [
      {
        id: "b-11",
        bulkerNumber: "TN09QW7712",
        status: "SEND",
        salesOrderNumber: "204902",
        transporterName: "South India Carriers",
        permit: "PM-6601",
        destination: "Jhagadia Complex",
        orderDate: "2026-10-23T06:00:00.000Z",
      },
      {
        id: "b-12",
        bulkerNumber: "GJ12KL4411",
        status: "SEND",
        salesOrderNumber: "204905",
        transporterName: "Shreeji Logistics",
        permit: "PM-9850",
        destination: "Jhagadia Complex",
        orderDate: "2026-10-23T06:45:00.000Z",
      },
      {
        id: "b-13",
        bulkerNumber: "GJ12PQ1199",
        status: "OUT",
        salesOrderNumber: "204870",
        transporterName: "Mahalaxmi Transport",
        permit: "PM-4430",
        destination: "Jhagadia Complex",
        orderDate: "2026-10-23T02:15:00.000Z",
        plantOutAt: "2026-10-23T07:45:00.000Z",
      },
      {
        id: "b-14",
        bulkerNumber: "TN09AB3341",
        status: "OUT",
        salesOrderNumber: "204871",
        transporterName: "South India Carriers",
        permit: "PM-6605",
        destination: "Jhagadia Complex",
        orderDate: "2026-10-23T03:30:00.000Z",
        plantOutAt: "2026-10-23T08:40:00.000Z",
      },
      {
        id: "b-15",
        bulkerNumber: "GJ12RS8801",
        status: "OUT",
        salesOrderNumber: "204874",
        transporterName: "Shreeji Logistics",
        permit: "PM-9860",
        destination: "Jhagadia Complex",
        orderDate: "2026-10-23T04:00:00.000Z",
        plantOutAt: "2026-10-23T09:20:00.000Z",
      },
    ],
  },
  {
    customerName: "Asahi India Glass Ltd (AIS)",
    vraCount: 0,
    allocatedCount: 1,
    sendCount: 0,
    outCount: 1,
    totalCount: 2,
    bulkers: [
      {
        id: "b-16",
        bulkerNumber: "HR55XY1209",
        status: "ALLOCATED",
        salesOrderNumber: "204920",
        transporterName: "Haryana Roadlines",
        permit: "PM-5510",
        destination: "Taloja Unit",
        orderDate: "2026-10-23T08:00:00.000Z",
      },
      {
        id: "b-17",
        bulkerNumber: "GJ12TU4420",
        status: "OUT",
        salesOrderNumber: "204882",
        transporterName: "Mahalaxmi Transport",
        permit: "PM-4450",
        destination: "Taloja Unit",
        orderDate: "2026-10-23T04:30:00.000Z",
        plantOutAt: "2026-10-23T10:00:00.000Z",
      },
    ],
  },
  {
    customerName: "Gold Plus Glass Industry Ltd",
    vraCount: 0,
    allocatedCount: 0,
    sendCount: 1,
    outCount: 1,
    totalCount: 2,
    bulkers: [
      {
        id: "b-18",
        bulkerNumber: "UP14ZZ9912",
        status: "SEND",
        salesOrderNumber: "204918",
        transporterName: "National Cargo",
        permit: "PM-8810",
        destination: "Kala Amb",
        orderDate: "2026-10-23T07:20:00.000Z",
      },
      {
        id: "b-19",
        bulkerNumber: "GJ12VW6610",
        status: "OUT",
        salesOrderNumber: "204889",
        transporterName: "Patel Roadways",
        permit: "PM-7740",
        destination: "Kala Amb",
        orderDate: "2026-10-23T05:00:00.000Z",
        plantOutAt: "2026-10-23T10:15:00.000Z",
      },
    ],
  },
  {
    customerName: "Unallocated (VRA Queue)",
    vraCount: 3,
    allocatedCount: 0,
    sendCount: 0,
    outCount: 0,
    totalCount: 3,
    bulkers: [
      {
        id: "b-20",
        bulkerNumber: "GJ12AB9001",
        status: "VRA",
        salesOrderNumber: null,
        transporterName: "Shreeji Logistics",
        permit: "PM-9890",
        destination: "Waiting Gate",
        orderDate: "2026-10-23T08:15:00.000Z",
      },
      {
        id: "b-21",
        bulkerNumber: "GJ03BC1102",
        status: "VRA",
        salesOrderNumber: null,
        transporterName: "Mahalaxmi Transport",
        permit: "PM-4480",
        destination: "Waiting Gate",
        orderDate: "2026-10-23T08:30:00.000Z",
      },
      {
        id: "b-22",
        bulkerNumber: "GJ12CD4490",
        status: "VRA",
        salesOrderNumber: null,
        transporterName: "Patel Roadways",
        permit: "PM-7760",
        destination: "Waiting Gate",
        orderDate: "2026-10-23T08:45:00.000Z",
      },
    ],
  },
];

export function BulkerCustomerSummaryTab() {
  // Mode: "date" vs "month"
  const [mode, setMode] = useState<"date" | "month">("date");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthIST());
  const [searchQuery, setSearchQuery] = useState("");

  // Drilldown dialog state
  const [drilldownCustomer, setDrilldownCustomer] = useState<CustomerSummaryRow | null>(null);

  // Filtered rows
  const filteredData = useMemo(() => {
    let list = DUMMY_SUMMARY_DATA;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.customerName.toLowerCase().includes(q));
    }
    return list;
  }, [searchQuery]);

  // Aggregate Totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, r) => ({
        vra: acc.vra + r.vraCount,
        allocated: acc.allocated + r.allocatedCount,
        send: acc.send + r.sendCount,
        out: acc.out + r.outCount,
        total: acc.total + r.totalCount,
      }),
      { vra: 0, allocated: 0, send: 0, out: 0, total: 0 }
    );
  }, [filteredData]);

  const activePeriodLabel =
    mode === "date"
      ? selectedDate || getTodayIST()
      : RECENT_MONTHS.find((m) => m.value === selectedMonth)?.label || selectedMonth;

  return (
    <div className="space-y-4">
      {/* Top Filter & Mode Selection Bar */}
      <div className="p-4 bg-[#121316] border border-border rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-1">View Mode:</span>
            <div className="inline-flex rounded-lg bg-black/40 p-1 border border-border/80">
              <button
                type="button"
                onClick={() => setMode("date")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  mode === "date"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Datewise (Daily)
              </button>
              <button
                type="button"
                onClick={() => setMode("month")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  mode === "month"
                    ? "bg-white text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Monthwise (Monthly)
              </button>
            </div>
          </div>

          {/* Date / Month Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {mode === "date" ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Select Day:</span>
                <DatePicker
                  value={selectedDate}
                  onChange={(val) => setSelectedDate(val || getTodayIST())}
                  clearable={false}
                  placeholder="Select Date"
                  className="w-44 bg-black/40 border-border text-white text-xs h-9"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Select Month:</span>
                <Select
                  value={selectedMonth}
                  onValueChange={(val) => setSelectedMonth(val)}
                >
                  <SelectTrigger className="w-44 bg-black/40 border-border text-white text-xs h-9">
                    <SelectValue placeholder="Choose Month" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#121316] border-border text-white">
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
        </div>

        {/* Search bar & quick summary indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer name..."
              className="pl-8 bg-black/40 border-border text-white text-xs h-8 w-full"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{filteredData.length} Customers</span>
            </span>
            <span>•</span>
            <span className="text-zinc-300 font-mono font-medium">
              {totals.total} Total Dispatches
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setSearchQuery("");
                setSelectedDate(getTodayIST());
                setSelectedMonth(getCurrentMonthIST());
              }}
              title="Reset Filters"
              className="w-8 h-8 p-0 bg-black/40 border-border text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="sr-only">Reset Filters</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-[#121316] border border-border rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 hover:bg-transparent bg-black/20">
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3.5 pl-4 w-[35%]">
                Customer Name
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[12%]">
                <span className="text-emerald-400">VRA</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[12%]">
                <span className="text-sky-400">Allocated</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[12%]">
                <span className="text-purple-400">Send (Plant)</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-[12%]">
                <span className="text-zinc-400">Out</span>
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center pr-4 w-[17%]">
                Total Bulkers
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-zinc-500 text-xs">
                  No customer dispatch records found for this period.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, idx) => {
                const isUnallocated = row.customerName.includes("Unallocated");

                return (
                  <TableRow
                    key={row.customerName || idx}
                    className="border-b border-border/40 hover:bg-white/[0.03] transition-colors"
                  >
                    {/* Customer Name */}
                    <TableCell className="py-3 pl-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span
                          className={cn(
                            "font-medium text-xs truncate max-w-xs",
                            isUnallocated ? "text-amber-400 italic" : "text-white"
                          )}
                        >
                          {row.customerName}
                        </span>
                      </div>
                    </TableCell>

                    {/* VRA Count */}
                    <TableCell className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-block min-w-7 text-xs font-mono font-medium py-0.5 rounded",
                          row.vraCount > 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "text-zinc-600"
                        )}
                      >
                        {row.vraCount}
                      </span>
                    </TableCell>

                    {/* ALLOCATED Count */}
                    <TableCell className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-block min-w-7 text-xs font-mono font-medium py-0.5 rounded",
                          row.allocatedCount > 0
                            ? "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            : "text-zinc-600"
                        )}
                      >
                        {row.allocatedCount}
                      </span>
                    </TableCell>

                    {/* SEND Count */}
                    <TableCell className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-block min-w-7 text-xs font-mono font-medium py-0.5 rounded",
                          row.sendCount > 0
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "text-zinc-600"
                        )}
                      >
                        {row.sendCount}
                      </span>
                    </TableCell>

                    {/* OUT Count */}
                    <TableCell className="py-3 text-center">
                      <span
                        className={cn(
                          "inline-block min-w-7 text-xs font-mono font-medium py-0.5 rounded",
                          row.outCount > 0
                            ? "bg-zinc-500/10 text-zinc-300 border border-zinc-500/20"
                            : "text-zinc-600"
                        )}
                      >
                        {row.outCount}
                      </span>
                    </TableCell>

                    {/* Interactive TOTAL Count: Click to open dialog */}
                    <TableCell className="py-3 pr-4 text-center">
                      <button
                        type="button"
                        onClick={() => setDrilldownCustomer(row)}
                        disabled={row.totalCount === 0}
                        title={`View ${row.totalCount} assigned bulkers for ${row.customerName}`}
                        className={cn(
                          "inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-bold transition-all shadow-sm",
                          row.totalCount > 0
                            ? "bg-white/10 hover:bg-white hover:text-black text-white cursor-pointer active:scale-95"
                            : "bg-zinc-900 text-zinc-600 cursor-not-allowed"
                        )}
                      >
                        <span>{row.totalCount}</span>
                        {row.totalCount > 0 && (
                          <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-black" />
                        )}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}

            {/* Grand Summary Footer Row */}
            {filteredData.length > 0 && (
              <TableRow className="bg-black/50 border-t-2 border-border/80 font-bold">
                <TableCell className="py-3.5 pl-4 text-xs font-semibold text-white tracking-wide uppercase">
                  Total Dispatches
                </TableCell>
                <TableCell className="py-3.5 text-center text-xs font-mono text-emerald-400">
                  {totals.vra}
                </TableCell>
                <TableCell className="py-3.5 text-center text-xs font-mono text-sky-400">
                  {totals.allocated}
                </TableCell>
                <TableCell className="py-3.5 text-center text-xs font-mono text-purple-400">
                  {totals.send}
                </TableCell>
                <TableCell className="py-3.5 text-center text-xs font-mono text-zinc-300">
                  {totals.out}
                </TableCell>
                <TableCell className="py-3.5 pr-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-md bg-white text-black font-mono font-bold text-xs">
                    {totals.total}
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Drill-down Dialog */}
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
