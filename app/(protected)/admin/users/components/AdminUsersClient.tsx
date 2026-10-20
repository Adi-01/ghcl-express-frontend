"use client";

import { useState, useMemo } from "react";
import { type LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { RefreshCcw, ShieldAlert, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { User } from "@/lib/types";
import { useAdminUsersListQuery } from "@/lib/hooks/queries/useAdminUsersQuery";
import { useAdminDeleteUserMutation } from "@/lib/hooks/mutations/useAdminMutations";
import { QUERY_KEYS } from "@/lib/constants";

// Modals & Table
import { AdminUserEditModal } from "./AdminUserEditModal";
import { AdminUserCreateModal } from "./AdminUserCreateModal";
import { AdminTable } from "@/components/shared/AdminTable";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

export function AdminUsersClient() {
  const queryClient = useQueryClient();

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const queryParams = {
    page,
    limit: 10,
    search: activeSearch || undefined,
    is_active: statusFilter === "all" ? undefined : statusFilter === "true",
  };

  const {
    data: responseData,
    isLoading,
    isFetching,
  } = useAdminUsersListQuery(queryParams);

  const users = useMemo(() => {
    if (!responseData) return [];
    if (Array.isArray(responseData.data)) return responseData.data;
    if (Array.isArray(responseData.items)) return responseData.items;
    return [];
  }, [responseData]);

  const meta = responseData?.meta || responseData?.pagination;
  const pageCount = meta?.total_pages || meta?.totalPages || 1;
  const totalItems = meta?.total_items || meta?.totalItems || users.length;

  const deleteMutation = useAdminDeleteUserMutation();

  // Component States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete Dialog State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const executeDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate(userToDelete.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setUserToDelete(null);
        },
      });
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold text-white truncate block"
              title={row.original.email}
            >
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "emp_id",
        header: "Emp ID",
        size: 140,
        cell: ({ row }) => (
          <span
            className="font-mono text-sm text-zinc-300 truncate block"
            title={row.original.emp_id || ""}
          >
            {row.original.emp_id || (
              <span className="text-muted-foreground/50">-</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "username",
        header: "Username",
        size: 130,
        cell: ({ row }) => (
          <span
            className="text-zinc-200 truncate block"
            title={row.original.username || ""}
          >
            {row.original.username || "-"}
          </span>
        ),
      },
      {
        accessorKey: "labels",
        header: "Labels",
        size: 200,
        cell: ({ row }) => {
          const displayLabels = (row.original.labels || []).filter(
            (label) => String(label).toUpperCase() !== "EMPLOYEE"
          );
          return (
            <div className="flex flex-wrap gap-1 max-w-full overflow-hidden">
              {displayLabels.length > 0 ? (
                displayLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className={cn(
                      "text-[10px] uppercase border truncate max-w-[180px]",
                      ["ADMIN", "SUPERADMIN"].includes(label.toUpperCase())
                        ? "bg-white text-black border-white font-semibold"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    )}
                    title={label}
                  >
                    {label}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground/50">-</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center">
            {row.original.is_active ? (
              <Badge className="bg-emerald-950/60 text-emerald-400 border border-emerald-900 text-[10px] shrink-0">
                Active
              </Badge>
            ) : (
              <Badge variant="destructive" className="text-[10px] shrink-0">
                Blocked
              </Badge>
            )}
          </div>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Joined",
        size: 130,
        cell: ({ row }) => {
          const dateVal = row.original.created_at;
          if (!dateVal)
            return <span className="text-muted-foreground text-sm">-</span>;
          return (
            <span className="text-muted-foreground text-sm truncate block">
              {new Date(dateVal).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          );
        },
      },
    ],
    []
  );

  const STATUS_LABELS: Record<string, string> = {
    all: "All Users",
    true: "Active Users",
    false: "Blocked Users",
  };

  // Draft filters for popover
  const [draftStatusFilter, setDraftStatusFilter] = useState("all");

  const activeFiltersCount = useMemo(() => {
    return statusFilter !== "all" ? 1 : 0;
  }, [statusFilter]);

  const handleApplyFilters = () => {
    setStatusFilter(draftStatusFilter);
    setPage(1);
  };

  const handleResetFilters = () => {
    setDraftStatusFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const refreshPage = async () => {
    setSearchInput("");
    setActiveSearch("");
    handleResetFilters();

    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.admin.users.all,
    });
  };

  const isFiltered = Boolean(activeSearch || statusFilter !== "all");
  const isGlobalEmpty = !isLoading && !isFiltered && users.length === 0;

  const userFilterContent = (
    <div className="space-y-3.5">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Account Status
        </label>
        <Select
          value={draftStatusFilter}
          onValueChange={(value) => setDraftStatusFilter(value || "all")}
        >
          <SelectTrigger className="w-full bg-black/40 border-border text-white text-xs h-9">
            <SelectValue placeholder="All Users">
              {STATUS_LABELS[draftStatusFilter] || "All Users"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-[#121316] border border-border text-white">
            <SelectItem value="all" className="text-xs">
              All Users
            </SelectItem>
            <SelectItem value="true" className="text-xs">
              Active Users
            </SelectItem>
            <SelectItem value="false" className="text-xs">
              Blocked Users
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          Manage Users
        </h1>
      </div>

      <AdminTable
        data={users}
        columns={columns}
        getRowId={(row: User) => String(row.id)}
        isLoading={isLoading}
        enablePagination={true}
        pageCount={pageCount}
        totalItems={totalItems}
        pageIndex={page - 1}
        pageSize={10}
        onPaginationChange={(p) => setPage(p.pageIndex + 1)}
        hideToolbar={isGlobalEmpty}
        enableRowSelection={true}
        searchPlaceholder="Search email or name..."
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={handleSearch}
        onAddAction={() => setIsCreateModalOpen(true)}
        addLabel="Add User"
        onRefresh={refreshPage}
        isRefreshing={isFetching}
        filterContent={userFilterContent}
        filterTitle="Filter Users"
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        emptyStateIcon={<ShieldAlert className="w-12 h-12 text-muted-foreground/60" />}
        emptyStateTitle={isFiltered ? "No Matching Users" : "No Users Found"}
        emptyStateDescription={
          isFiltered
            ? "No users match your active search query or status filter."
            : "No registered users exist in the system. Get started by adding a user."
        }
        emptyStateAction={
          isFiltered ? (
            <Button
              variant="outline"
              size="sm"
              onClick={refreshPage}
              className="border-border text-xs text-white hover:bg-zinc-800"
            >
              Reset Filters
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2 bg-white text-black hover:bg-zinc-200 h-9 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          )
        }
        onEditAction={(row) => {
          setSelectedUser(row);
          setIsEditModalOpen(true);
        }}
        onDeleteAction={(row) => {
          setUserToDelete(row);
          setIsDeleteDialogOpen(true);
        }}
      />

      {/* Modals & Dialogs */}
      <AdminUserCreateModal
        isOpen={isCreateModalOpen}
        onClose={setIsCreateModalOpen}
      />

      <AdminUserEditModal
        isOpen={isEditModalOpen}
        onClose={setIsEditModalOpen}
        user={selectedUser}
      />

      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={executeDelete}
        title="Delete User"
        description={`Are you sure you want to permanently delete user "${String(
          userToDelete?.username || userToDelete?.email || ""
        )}" ? This action cannot be undone.`}
        isDestructive={true}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
