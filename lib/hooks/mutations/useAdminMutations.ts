import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  adminCreateUserAction,
  adminUpdateUserAction,
  adminDeleteUserAction,
  AdminCreateUserInput,
  AdminUpdateUserInput,
} from "@/app/actions/admin-user.actions";
import {
  adminUpsertBankDetailsAction,
  adminDeleteBankDetailsAction,
  AdminUpsertBankDetailsInput,
} from "@/app/actions/admin-bank.actions";
import {
  adminUpdateDocumentStatusAction,
  adminBulkApproveAction,
  adminBulkRejectAction,
  adminDeleteDocumentAction,
  AdminUpdateDocStatusInput,
} from "@/app/actions/admin-doc.actions";
import { User, UserRole, PaginatedResponse, DocumentItem } from "@/lib/types";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";

export function useAdminCreateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminCreateUserInput) => {
      const res = await adminCreateUserAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("User created successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to create user.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all });
    },
  });
}

export function useAdminUpdateUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminUpdateUserInput }) => {
      const res = await adminUpdateUserAction(id, data);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.users.all });

      const previousLists = queryClient.getQueriesData<PaginatedResponse<User>>({
        queryKey: ["admin", "users", "list"],
      });
      const previousDetails = queryClient.getQueriesData<User>({
        queryKey: ["admin", "users", "detail", id],
      });

      // Update in paginated lists
      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin", "users", "list"] },
        (old) => {
          if (!old) return old;
          const updateItem = (u: User): User =>
            u.id === id
              ? {
                  ...u,
                  ...data,
                  role: (data.role as UserRole) ?? u.role,
                  updated_at: new Date().toISOString(),
                }
              : u;

          const updatedData = old.data ? old.data.map(updateItem) : undefined;
          const updatedItems = old.items ? old.items.map(updateItem) : undefined;

          return {
            ...old,
            ...(updatedData ? { data: updatedData } : {}),
            ...(updatedItems ? { items: updatedItems } : {}),
          };
        }
      );

      // Update in user detail
      queryClient.setQueriesData<User>(
        { queryKey: ["admin", "users", "detail", id] },
        (old) =>
          old
            ? {
                ...old,
                ...data,
                role: (data.role as UserRole) ?? old.role,
                updated_at: new Date().toISOString(),
              }
            : old
      );

      return { previousLists, previousDetails };
    },
    onSuccess: () => {
      toast.success("User updated successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (context?.previousDetails) {
        context.previousDetails.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update user.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all });
    },
  });
}

export function useAdminDeleteUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminDeleteUserAction(id);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.users.all });

      const previousLists = queryClient.getQueriesData<PaginatedResponse<User>>({
        queryKey: ["admin", "users", "list"],
      });

      queryClient.setQueriesData<PaginatedResponse<User>>(
        { queryKey: ["admin", "users", "list"] },
        (old) => {
          if (!old) return old;
          const filterItem = (u: User) => u.id !== id;

          const filteredData = old.data ? old.data.filter(filterItem) : undefined;
          const filteredItems = old.items ? old.items.filter(filterItem) : undefined;
          const origLen = old.data?.length ?? old.items?.length ?? 0;
          const newLen = filteredData?.length ?? filteredItems?.length ?? 0;
          const diff = origLen - newLen;

          const updateMeta = (meta?: any) => {
            if (!meta) return meta;
            return {
              ...meta,
              total_items: meta.total_items ? Math.max(0, meta.total_items - diff) : meta.total_items,
              totalItems: meta.totalItems ? Math.max(0, meta.totalItems - diff) : meta.totalItems,
            };
          };

          return {
            ...old,
            ...(filteredData ? { data: filteredData } : {}),
            ...(filteredItems ? { items: filteredItems } : {}),
            meta: updateMeta(old.meta),
            pagination: updateMeta(old.pagination),
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("User deleted successfully.");
    },
    onError: (error: any, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete user.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all });
    },
  });
}

export function useAdminUpsertBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AdminUpsertBankDetailsInput) => {
      const res = await adminUpsertBankDetailsAction(input);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("Bank details saved successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to save bank details.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.bankDetails.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all });
    },
  });
}

export function useAdminDeleteBankDetailsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await adminDeleteBankDetailsAction(userId);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success("Bank details deleted successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete bank details.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.bankDetails.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.users.all });
    },
  });
}

export function useAdminUpdateDocStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AdminUpdateDocStatusInput }) => {
      const res = await adminUpdateDocumentStatusAction(id, data);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.documents.all });

      const previousLists = queryClient.getQueriesData<PaginatedResponse<DocumentItem>>({
        queryKey: ["admin", "documents", "list"],
      });

      queryClient.setQueriesData<PaginatedResponse<DocumentItem>>(
        { queryKey: ["admin", "documents", "list"] },
        (old) => {
          if (!old) return old;
          const updateDoc = (doc: DocumentItem) => {
            if (doc.id !== id) return doc;
            const now = new Date().toISOString();
            return {
              ...doc,
              status: data.status,
              verification_status: data.status,
              rejection_reason: data.rejection_reason || null,
              verified_at: data.status === "APPROVED" ? now : null,
              updated_at: now,
            };
          };

          const updatedData = old.data ? old.data.map(updateDoc) : undefined;
          const updatedItems = old.items ? old.items.map(updateDoc) : undefined;

          return {
            ...old,
            ...(updatedData ? { data: updatedData } : {}),
            ...(updatedItems ? { items: updatedItems } : {}),
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("Document status updated.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update document status.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.documents.all });
    },
  });
}

export function useAdminBulkApproveMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentIds: string[]) => {
      const res = await adminBulkApproveAction(documentIds);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (documentIds) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.documents.all });
      const idSet = new Set(documentIds);

      const previousLists = queryClient.getQueriesData<PaginatedResponse<DocumentItem>>({
        queryKey: ["admin", "documents", "list"],
      });

      queryClient.setQueriesData<PaginatedResponse<DocumentItem>>(
        { queryKey: ["admin", "documents", "list"] },
        (old) => {
          if (!old) return old;
          const now = new Date().toISOString();
          const updateDoc = (doc: DocumentItem) => {
            if (!idSet.has(doc.id)) return doc;
            return {
              ...doc,
              status: "APPROVED" as const,
              verification_status: "APPROVED" as const,
              rejection_reason: null,
              verified_at: now,
              updated_at: now,
            };
          };

          const updatedData = old.data ? old.data.map(updateDoc) : undefined;
          const updatedItems = old.items ? old.items.map(updateDoc) : undefined;

          return {
            ...old,
            ...(updatedData ? { data: updatedData } : {}),
            ...(updatedItems ? { items: updatedItems } : {}),
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("Documents approved successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to approve documents.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.documents.all });
    },
  });
}

export function useAdminBulkRejectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentIds,
      rejectionReason,
    }: {
      documentIds: string[];
      rejectionReason: string;
    }) => {
      const res = await adminBulkRejectAction(documentIds, rejectionReason);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async ({ documentIds, rejectionReason }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.documents.all });
      const idSet = new Set(documentIds);

      const previousLists = queryClient.getQueriesData<PaginatedResponse<DocumentItem>>({
        queryKey: ["admin", "documents", "list"],
      });

      queryClient.setQueriesData<PaginatedResponse<DocumentItem>>(
        { queryKey: ["admin", "documents", "list"] },
        (old) => {
          if (!old) return old;
          const now = new Date().toISOString();
          const updateDoc = (doc: DocumentItem) => {
            if (!idSet.has(doc.id)) return doc;
            return {
              ...doc,
              status: "REJECTED" as const,
              verification_status: "REJECTED" as const,
              rejection_reason: rejectionReason,
              verified_at: null,
              updated_at: now,
            };
          };

          const updatedData = old.data ? old.data.map(updateDoc) : undefined;
          const updatedItems = old.items ? old.items.map(updateDoc) : undefined;

          return {
            ...old,
            ...(updatedData ? { data: updatedData } : {}),
            ...(updatedItems ? { items: updatedItems } : {}),
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("Documents rejected successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to reject documents.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.documents.all });
    },
  });
}

export function useAdminDeleteDocMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await adminDeleteDocumentAction(id);
      if (!res.success) {
        throw res.error;
      }
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.admin.documents.all });

      const previousLists = queryClient.getQueriesData<PaginatedResponse<DocumentItem>>({
        queryKey: ["admin", "documents", "list"],
      });

      queryClient.setQueriesData<PaginatedResponse<DocumentItem>>(
        { queryKey: ["admin", "documents", "list"] },
        (old) => {
          if (!old) return old;
          const filterItem = (doc: DocumentItem) => doc.id !== id;

          const filteredData = old.data ? old.data.filter(filterItem) : undefined;
          const filteredItems = old.items ? old.items.filter(filterItem) : undefined;
          const origLen = old.data?.length ?? old.items?.length ?? 0;
          const newLen = filteredData?.length ?? filteredItems?.length ?? 0;
          const diff = origLen - newLen;

          const updateMeta = (meta?: any) => {
            if (!meta) return meta;
            return {
              ...meta,
              total_items: meta.total_items ? Math.max(0, meta.total_items - diff) : meta.total_items,
              totalItems: meta.totalItems ? Math.max(0, meta.totalItems - diff) : meta.totalItems,
            };
          };

          return {
            ...old,
            ...(filteredData ? { data: filteredData } : {}),
            ...(filteredItems ? { items: filteredItems } : {}),
            meta: updateMeta(old.meta),
            pagination: updateMeta(old.pagination),
          };
        }
      );

      return { previousLists };
    },
    onSuccess: () => {
      toast.success("Document deleted successfully.");
    },
    onError: (error: any, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, val]) => queryClient.setQueryData(key, val));
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete document.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.documents.all });
    },
  });
}
