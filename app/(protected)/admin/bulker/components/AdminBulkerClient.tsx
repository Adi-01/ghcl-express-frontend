"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  Plus,
  Truck,
  Building2,
  ClipboardList,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminTable } from "@/components/shared/AdminTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

import {
  useBulkerInfoQuery,
  useCustomerInfoQuery,
} from "@/lib/hooks/queries/useBulkerQuery";
import {
  useDeleteBulkerInfoMutation,
  useDeleteCustomerInfoMutation,
} from "@/lib/hooks/mutations/useBulkerMutations";
import type { BulkerInfo, CustomerInfo } from "@/lib/types/bulker";
import { BulkerInfoModal } from "./BulkerInfoModal";
import { CustomerInfoModal } from "./CustomerInfoModal";
import { BulkerAuditLogsTab } from "./BulkerAuditLogsTab";
import { BulkerCustomerSummaryTab } from "./BulkerCustomerSummaryTab";
import { cn, formatDateTime } from "@/lib/utils";

export function AdminBulkerClient() {
  const [activeTab, setActiveTab] = useState<"dispatches" | "summary" | "bulker" | "customer">("dispatches");

  // Filters & Search for Bulker tab
  const [bulkerSearch, setBulkerSearch] = useState("");
  const [activeBulkerSearch, setActiveBulkerSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "allowed" | "not_allowed">("all");
  const [draftBulkerStatus, setDraftBulkerStatus] = useState<"all" | "allowed" | "not_allowed">("all");

  // Filters & Search for Customer tab
  const [customerSearch, setCustomerSearch] = useState("");
  const [activeCustomerSearch, setActiveCustomerSearch] = useState("");

  // Modals state
  const [isBulkerModalOpen, setIsBulkerModalOpen] = useState(false);
  const [selectedBulker, setSelectedBulker] = useState<BulkerInfo | null>(null);

  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);

  // Deletion confirm state
  const [deleteBulkerTarget, setDeleteBulkerTarget] = useState<BulkerInfo | null>(null);
  const [deleteCustomerTarget, setDeleteCustomerTarget] = useState<CustomerInfo | null>(null);

  // Queries
  const {
    data: bulkers,
    isLoading: isBulkersLoading,
    isFetching: isBulkersFetching,
    refetch: refetchBulkers,
  } = useBulkerInfoQuery();

  const {
    data: customers,
    isLoading: isCustomersLoading,
    isFetching: isCustomersFetching,
    refetch: refetchCustomers,
  } = useCustomerInfoQuery();

  // Mutations
  const deleteBulkerMutate = useDeleteBulkerInfoMutation();
  const deleteCustomerMutate = useDeleteCustomerInfoMutation();

  const confirmDeleteBulker = () => {
    if (!deleteBulkerTarget) return;
    deleteBulkerMutate.mutate(deleteBulkerTarget.id, {
      onSuccess: () => setDeleteBulkerTarget(null),
    });
  };

  const confirmDeleteCustomer = () => {
    if (!deleteCustomerTarget) return;
    deleteCustomerMutate.mutate(deleteCustomerTarget.id, {
      onSuccess: () => setDeleteCustomerTarget(null),
    });
  };

  // Filtered lists
  const filteredBulkers = useMemo(() => {
    if (!bulkers) return [];
    let list = bulkers;
    if (activeBulkerSearch) {
      const q = activeBulkerSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.bulkerNumber.toLowerCase().includes(q) ||
          b.transporterName.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      const allowed = statusFilter === "allowed";
      list = list.filter((b) => b.isAllowed === allowed);
    }
    return list;
  }, [bulkers, activeBulkerSearch, statusFilter]);

  const filteredCustomers = useMemo(() => {
    if (!customers) return [];
    let list = customers;
    if (activeCustomerSearch) {
      const q = activeCustomerSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.destination.toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, activeCustomerSearch]);

  const bulkerColumns = useMemo<ColumnDef<BulkerInfo>[]>(
    () => [
      {
        accessorKey: "bulkerNumber",
        header: "Bulker No",
        size: 160,
        cell: ({ row }) => (
          <span className="font-mono font-medium text-white text-xs">
            {row.original.bulkerNumber}
          </span>
        ),
      },
      {
        accessorKey: "transporterName",
        header: "Transporter",
        size: 200,
        cell: ({ row }) => (
          <span className="text-xs text-zinc-200 truncate block max-w-[190px]" title={row.original.transporterName}>
            {row.original.transporterName}
          </span>
        ),
      },
      {
        accessorKey: "permit",
        header: "Permit",
        size: 140,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate block max-w-[130px]" title={row.original.permit || ""}>
            {row.original.permit || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isAllowed",
        header: "Status",
        size: 120,
        cell: ({ row }) => (
          <Badge
            variant={row.original.isAllowed ? "secondary" : "destructive"}
            className={cn(
              "text-[10px] shrink-0",
              row.original.isAllowed &&
                "bg-emerald-950/60 text-emerald-400 border border-emerald-900"
            )}
          >
            {row.original.isAllowed ? "Allowed" : "Not Allowed"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Added Date",
        size: 140,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt, "date")}
          </span>
        ),
      },
    ],
    []
  );

  const customerColumns = useMemo<ColumnDef<CustomerInfo>[]>(
    () => [
      {
        accessorKey: "customerName",
        header: "Customer Name",
        size: 240,
        cell: ({ row }) => (
          <span className="font-semibold text-white text-xs truncate block max-w-[230px]" title={row.original.customerName}>
            {row.original.customerName}
          </span>
        ),
      },
      {
        accessorKey: "destination",
        header: "Destination",
        size: 220,
        cell: ({ row }) => (
          <span className="text-xs text-zinc-300 truncate block max-w-[210px]" title={row.original.destination}>
            {row.original.destination}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Added Date",
        size: 140,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {formatDateTime(row.original.createdAt, "date")}
          </span>
        ),
      },
    ],
    []
  );

  const isBulkerFiltered = Boolean(activeBulkerSearch || statusFilter !== "all");
  const isCustomerFiltered = Boolean(activeCustomerSearch);
  const isBulkerGlobalEmpty = !isBulkersLoading && !isBulkerFiltered && (bulkers?.length ?? 0) === 0;
  const isCustomerGlobalEmpty = !isCustomersLoading && !isCustomerFiltered && (customers?.length ?? 0) === 0;

  const bulkerFilterContent = (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Authorization Status
        </label>
        <Select
          value={draftBulkerStatus}
          onValueChange={(val) =>
            setDraftBulkerStatus(val as "all" | "allowed" | "not_allowed")
          }
        >
          <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#121316] border border-border text-white">
            <SelectItem value="all" className="text-xs">
              All Statuses
            </SelectItem>
            <SelectItem value="allowed" className="text-xs">
              Allowed
            </SelectItem>
            <SelectItem value="not_allowed" className="text-xs">
              Not Allowed
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Bulker Management
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Historical dispatch audit logs, truck fleet permits, and verified customer destinations.
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as "dispatches" | "summary" | "bulker" | "customer");
        }}
        className="w-full space-y-4"
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-[#121316] border border-border p-1 h-10 rounded-lg w-full sm:w-auto grid grid-cols-4 sm:flex">
            <TabsTrigger
              value="dispatches"
              title="Dispatch Logs"
              
            >
              <ClipboardList className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Dispatch Logs</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              title="Customer Summary"
              
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Customer Summary</span>
              
            </TabsTrigger>
            <TabsTrigger
              value="bulker"
              title="Bulkers"
              
            >
              <Truck className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Bulkers</span>
              
            </TabsTrigger>
            <TabsTrigger
              value="customer"
              title="Customers"
              
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Customers</span>
              
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Dispatch Audit Logs */}
        {activeTab === "dispatches" && <BulkerAuditLogsTab />}

        {/* Tab 2: Customer Summary (Datewise & Monthwise) */}
        {activeTab === "summary" && <BulkerCustomerSummaryTab />}

        {/* Tab 2: Bulker Master */}
        {activeTab === "bulker" && (
          <AdminTable
            data={filteredBulkers}
            columns={bulkerColumns}
            getRowId={(row: BulkerInfo) => row.id}
            isLoading={isBulkersLoading}
            enablePagination={true}
            pageSize={15}
            enableRowSelection={false}
            enableSerialNumber={true}
            hideToolbar={isBulkerGlobalEmpty}
            searchPlaceholder="Search bulker, transporter..."
            searchValue={bulkerSearch}
            onSearchChange={setBulkerSearch}
            onSearchSubmit={(e) => {
              e.preventDefault();
              setActiveBulkerSearch(bulkerSearch);
            }}
            onAddAction={() => {
              setSelectedBulker(null);
              setIsBulkerModalOpen(true);
            }}
            addLabel="Add Bulker"
            onRefresh={() => {
              setBulkerSearch("");
              setActiveBulkerSearch("");
              refetchBulkers();
            }}
            isRefreshing={isBulkersFetching}
            filterContent={bulkerFilterContent}
            filterTitle="Filter Bulkers"
            activeFiltersCount={statusFilter !== "all" ? 1 : 0}
            onResetFilters={() => {
              setDraftBulkerStatus("all");
              setStatusFilter("all");
            }}
            onApplyFilters={() => {
              setStatusFilter(draftBulkerStatus);
            }}
            emptyStateIcon={<Truck className="w-12 h-12 text-muted-foreground/60" />}
            emptyStateTitle={
              isBulkerFiltered
                ? "No Matching Bulkers"
                : "No Bulker Records Found"
            }
            emptyStateDescription={
              isBulkerFiltered
                ? "No bulkers match your active search or status filter."
                : "No authorized bulkers registered in the master registry. Add a bulker to get started."
            }
            emptyStateAction={
              isBulkerFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBulkerSearch("");
                    setActiveBulkerSearch("");
                    setDraftBulkerStatus("all");
                    setStatusFilter("all");
                  }}
                  className="border-border text-xs text-white hover:bg-zinc-800"
                >
                  Reset Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedBulker(null);
                    setIsBulkerModalOpen(true);
                  }}
                  className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Bulker
                </Button>
              )
            }
            onEditAction={(b) => {
              setSelectedBulker(b);
              setIsBulkerModalOpen(true);
            }}
            onDeleteAction={(b) => setDeleteBulkerTarget(b)}
          />
        )}

        {/* Tab 3: Customer Master */}
        {activeTab === "customer" && (
          <AdminTable
            data={filteredCustomers}
            columns={customerColumns}
            getRowId={(row: CustomerInfo) => row.id}
            isLoading={isCustomersLoading}
            enablePagination={true}
            pageSize={15}
            enableRowSelection={false}
            enableSerialNumber={true}
            hideToolbar={isCustomerGlobalEmpty}
            searchPlaceholder="Search customer, destination..."
            searchValue={customerSearch}
            onSearchChange={setCustomerSearch}
            onSearchSubmit={(e) => {
              e.preventDefault();
              setActiveCustomerSearch(customerSearch);
            }}
            onAddAction={() => {
              setSelectedCustomer(null);
              setIsCustomerModalOpen(true);
            }}
            addLabel="Add Destination"
            onRefresh={() => {
              setCustomerSearch("");
              setActiveCustomerSearch("");
              refetchCustomers();
            }}
            isRefreshing={isCustomersFetching}
            emptyStateIcon={<Building2 className="w-12 h-12 text-muted-foreground/60" />}
            emptyStateTitle={
              isCustomerFiltered
                ? "No Matching Destinations"
                : "No Customer Destinations Found"
            }
            emptyStateDescription={
              isCustomerFiltered
                ? "No customer destinations match your active search query."
                : "No customer destinations registered in the master directory. Add a destination to get started."
            }
            emptyStateAction={
              isCustomerFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomerSearch("");
                    setActiveCustomerSearch("");
                  }}
                  className="border-border text-xs text-white hover:bg-zinc-800"
                >
                  Clear Search
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsCustomerModalOpen(true);
                  }}
                  className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Destination
                </Button>
              )
            }
            onEditAction={(c) => {
              setSelectedCustomer(c);
              setIsCustomerModalOpen(true);
            }}
            onDeleteAction={(c) => setDeleteCustomerTarget(c)}
          />
        )}
      </Tabs>

      {/* Modals & Dialogs */}
      <BulkerInfoModal
        isOpen={isBulkerModalOpen}
        onClose={setIsBulkerModalOpen}
        bulkerInfo={selectedBulker}
      />

      <CustomerInfoModal
        isOpen={isCustomerModalOpen}
        onClose={setIsCustomerModalOpen}
        customerInfo={selectedCustomer}
      />

      <ConfirmModal
        isOpen={Boolean(deleteBulkerTarget)}
        onClose={() => setDeleteBulkerTarget(null)}
        onConfirm={confirmDeleteBulker}
        title="Delete Bulker"
        description={`Are you sure you want to permanently delete bulker "${deleteBulkerTarget?.bulkerNumber}" from the master registry?`}
        isDestructive={true}
        isPending={deleteBulkerMutate.isPending}
      />

      <ConfirmModal
        isOpen={Boolean(deleteCustomerTarget)}
        onClose={() => setDeleteCustomerTarget(null)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer Destination"
        description={`Are you sure you want to permanently delete destination "${deleteCustomerTarget?.customerName} (${deleteCustomerTarget?.destination})" ?`}
        isDestructive={true}
        isPending={deleteCustomerMutate.isPending}
      />
    </div>
  );
}

// Re-export as ManageBulkerCustomerClient for backward compatibility
export { AdminBulkerClient as ManageBulkerCustomerClient };
