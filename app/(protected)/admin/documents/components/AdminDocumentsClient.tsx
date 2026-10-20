"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import {
  FileText,
  BadgeCheck,
  BadgeAlert,
  XCircle,
  MoreHorizontal,
  CheckCircle2,
  Download,
  Eye,
} from "lucide-react";

import {
  useAdminDocsListQuery,
  useAdminDocStatsQuery,
} from "@/lib/hooks/queries/useAdminDocsQuery";
import {
  useAdminUpdateDocStatusMutation,
  useAdminBulkApproveMutation,
  useAdminBulkRejectMutation,
} from "@/lib/hooks/mutations/useAdminMutations";
import { DocumentItem } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminTable } from "@/components/shared/AdminTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export function AdminDocumentsClient() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const queryParams = {
    page,
    limit: 10,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: activeSearchQuery || undefined,
  };

  const { data: docsResponse, isLoading } = useAdminDocsListQuery(queryParams);
  const { data: stats } = useAdminDocStatsQuery();

  const updateStatusMutation = useAdminUpdateDocStatusMutation();
  const bulkApproveMutation = useAdminBulkApproveMutation();
  const bulkRejectMutation = useAdminBulkRejectMutation();

  const [actionDoc, setActionDoc] = useState<{
    id: string;
    action: "APPROVE" | "REJECT";
  } | null>(null);

  const [bulkAction, setBulkAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);

  const documents = useMemo(() => {
    if (!docsResponse) return [];
    if (Array.isArray(docsResponse.data)) return docsResponse.data;
    if (Array.isArray(docsResponse.items)) return docsResponse.items;
    return [];
  }, [docsResponse]);

  const meta = docsResponse?.meta || docsResponse?.pagination;
  const pageCount = meta?.total_pages || meta?.totalPages || 1;
  const totalItems = meta?.total_items || meta?.totalItems || documents.length;

  const isFiltered = Boolean(activeSearchQuery || statusFilter !== "ALL");
  const isGlobalEmpty =
    !isLoading &&
    (stats?.total === 0 || (!isFiltered && documents.length === 0));

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setStatusFilter("ALL");
    setPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearchQuery(searchQuery);
    setPage(1);
  };

  const handleApprove = async () => {
    if (!actionDoc) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: actionDoc.id,
        data: { status: "APPROVED" },
      });
    } finally {
      setActionDoc(null);
    }
  };

  const handleReject = async () => {
    if (!actionDoc) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: actionDoc.id,
        data: { status: "REJECTED", rejection_reason: "Rejected by admin" },
      });
    } finally {
      setActionDoc(null);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || bulkSelectedIds.length === 0) return;

    try {
      if (bulkAction === "APPROVE") {
        await bulkApproveMutation.mutateAsync(bulkSelectedIds);
      } else {
        await bulkRejectMutation.mutateAsync({
          documentIds: bulkSelectedIds,
          rejectionReason: "Rejected by admin",
        });
      }
    } finally {
      setBulkAction(null);
      setBulkSelectedIds([]);
    }
  };

  const columns = useMemo<ColumnDef<DocumentItem>[]>(
    () => [
      {
        accessorKey: "user.email",
        header: "User",
        size: 240,
        cell: ({ row }) => {
          const user = row.original.user;
          return (
            <div className="min-w-0 max-w-full">
              <p
                className="text-sm text-muted-foreground truncate"
                title={user?.username || "No Username"}
              >
                {user?.username || "No Username"}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "document_type",
        header: "Document Type",
        size: 180,
        cell: ({ row }) => (
          <span
            className="text-sm font-medium text-zinc-200 truncate block"
            title={row.original.document_type.replace(/_/g, " ")}
          >
            {row.original.document_type.replace(/_/g, " ")}
          </span>
        ),
      },
      {
        accessorKey: "verification_status",
        header: "Status",
        size: 130,
        cell: ({ row }) => {
          const status = row.original.verification_status || row.original.status;
          if (status === "APPROVED") {
            return (
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs shrink-0">
                <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Approved</span>
              </div>
            );
          } else if (status === "REJECTED") {
            return (
              <div className="flex items-center gap-1.5 text-rose-400 font-medium text-xs shrink-0">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">Rejected</span>
              </div>
            );
          }
          return (
            <div className="flex items-center gap-1.5 text-amber-400 font-medium text-xs shrink-0">
              <BadgeAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Pending</span>
            </div>
          );
        },
      },
      {
        accessorKey: "document_number",
        header: "Doc Number",
        size: 150,
        cell: ({ row }) => (
          <span
            className="font-mono text-xs tracking-wider text-muted-foreground truncate block"
            title={row.original.document_number || "-"}
          >
            {row.original.document_number || "-"}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Uploaded On",
        size: 140,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-xs truncate block">
            {row.original.created_at
              ? new Date(row.original.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "-"}
          </span>
        ),
      },
    ],
    []
  );

  const renderRowActions = (doc: DocumentItem) => {
    const fileUrl = doc.document_file_url || doc.document_url;
    const status = doc.verification_status || doc.status;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-white">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#121316] border border-border text-white shadow-lg">
          {fileUrl && (
            <DropdownMenuItem
              className="cursor-pointer hover:bg-zinc-800"
              onClick={() => window.open(fileUrl, "_blank")}
            >
              <Eye className="mr-2 h-4 w-4 text-zinc-300" />
              Preview
            </DropdownMenuItem>
          )}

          {status !== "APPROVED" && (
            <DropdownMenuItem
              className="cursor-pointer text-emerald-400 hover:bg-emerald-950/30"
              onClick={() => setActionDoc({ id: doc.id, action: "APPROVE" })}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </DropdownMenuItem>
          )}

          {status !== "REJECTED" && (
            <DropdownMenuItem
              className="cursor-pointer text-rose-400 focus:bg-destructive/10 focus:text-destructive"
              onClick={() => setActionDoc({ id: doc.id, action: "REJECT" })}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const [draftStatusFilter, setDraftStatusFilter] = useState<string>("ALL");

  const docFilterContent = (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Verification Status
        </label>
        <Select
          value={draftStatusFilter}
          onValueChange={(val: string | null) => {
            if (val) setDraftStatusFilter(val);
          }}
        >
          <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent className="bg-[#121316] border border-border text-white">
            <SelectItem value="ALL" className="text-xs">
              All Statuses
            </SelectItem>
            <SelectItem value="PENDING" className="text-xs">
              Pending
            </SelectItem>
            <SelectItem value="APPROVED" className="text-xs">
              Approved
            </SelectItem>
            <SelectItem value="REJECTED" className="text-xs">
              Rejected
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBulkActions = (selectedIds: string[]) => (
    <>
      <Button
        size="sm"
        className="text-emerald-400 border border-emerald-900 bg-emerald-950/40 hover:bg-emerald-950/60 h-7 text-xs rounded-full px-3"
        onClick={() => {
          setBulkSelectedIds(selectedIds);
          setBulkAction("APPROVE");
        }}
        disabled={bulkApproveMutation.isPending}
      >
        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
        Approve
      </Button>
      <Button
        size="sm"
        className="text-rose-400 border border-rose-900 bg-rose-950/40 hover:bg-rose-950/60 h-7 text-xs rounded-full px-3"
        onClick={() => {
          setBulkSelectedIds(selectedIds);
          setBulkAction("REJECT");
        }}
        disabled={bulkRejectMutation.isPending}
      >
        <XCircle className="w-3.5 h-3.5 mr-1.5" />
        Reject
      </Button>
    </>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Manage User Documents
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review, approve, and reject user identity documents.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#121316] border border-border/60 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Total Docs
          </p>
          <p className="text-2xl font-bold text-white mt-1">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-[#121316] border border-amber-500/20 bg-amber-500/5 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-amber-400">
            Pending
          </p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-[#121316] border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
            Approved
          </p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{stats?.approved ?? 0}</p>
        </div>
        <div className="bg-[#121316] border border-rose-500/20 bg-rose-500/5 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wider font-semibold text-rose-400">
            Rejected
          </p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{stats?.rejected ?? 0}</p>
        </div>
      </div>

      <AdminTable
        data={documents}
        columns={columns}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        pageCount={pageCount}
        totalItems={totalItems}
        pageIndex={page - 1}
        pageSize={10}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
        hideToolbar={isGlobalEmpty}
        searchPlaceholder="Search email, ID, doc number..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        enableRowSelection={true}
        enableSerialNumber={true}
        renderRowActions={renderRowActions}
        renderBulkActions={renderBulkActions}
        onRefresh={handleResetFilters}
        isRefreshing={isLoading}
        filterContent={docFilterContent}
        filterTitle="Filter Documents"
        activeFiltersCount={statusFilter !== "ALL" ? 1 : 0}
        onResetFilters={() => {
          setDraftStatusFilter("ALL");
          handleResetFilters();
        }}
        onApplyFilters={() => {
          setStatusFilter(draftStatusFilter);
          setPage(1);
        }}
        emptyStateTitle={
          isFiltered ? "No Matching Documents" : "No User Documents Found"
        }
        emptyStateDescription={
          isFiltered
            ? "No documents match your active search query or status filter."
            : "No user documents have been uploaded to the system yet."
        }
        emptyStateAction={
          isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="border-border text-xs text-white hover:bg-zinc-800"
            >
              Reset Filters
            </Button>
          ) : undefined
        }
        emptyStateIcon={
          <FileText className="w-10 h-10 text-muted-foreground/60" />
        }
      />

      {/* Single Approve / Reject Confirm */}
      <ConfirmModal
        isOpen={Boolean(actionDoc)}
        onClose={() => setActionDoc(null)}
        onConfirm={
          actionDoc?.action === "APPROVE" ? handleApprove : handleReject
        }
        title={
          actionDoc?.action === "APPROVE"
            ? "Approve Document"
            : "Reject Document"
        }
        description={`Are you sure you want to ${actionDoc?.action.toLowerCase()} this document?`}
        isPending={updateStatusMutation.isPending}
        isDestructive={actionDoc?.action === "REJECT"}
      />

      {/* Bulk Approve / Reject Confirm */}
      <ConfirmModal
        isOpen={Boolean(bulkAction)}
        onClose={() => setBulkAction(null)}
        onConfirm={handleBulkAction}
        title={`Bulk ${bulkAction === "APPROVE" ? "Approve" : "Reject"} Documents`}
        description={`Are you sure you want to ${bulkAction?.toLowerCase()} ${bulkSelectedIds.length} selected documents?`}
        isPending={
          bulkApproveMutation.isPending || bulkRejectMutation.isPending
        }
        isDestructive={bulkAction === "REJECT"}
      />
    </div>
  );
}
