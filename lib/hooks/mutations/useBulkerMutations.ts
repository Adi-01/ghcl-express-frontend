import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  createBulkerEntryAction,
  updateBulkerStatusAction,
} from "@/app/actions/bulker.actions";
import {
  updateBulkerEntryAction,
  deleteBulkerEntryAction,
  createBulkerInfoAction,
  updateBulkerInfoAction,
  deleteBulkerInfoAction,
  createCustomerInfoAction,
  updateCustomerInfoAction,
  deleteCustomerInfoAction,
  bulkDeleteBulkerEntriesAction,
  cleanupBulkerExecuteAction,
} from "@/app/actions/admin-bulker.actions";
import type {
  CreateBulkerEntryPayload,
  UpdateBulkerEntryPayload,
  BulkerStatus,
  BulkerEntry,
  BulkerInfo,
  CustomerInfo,
  BulkerEntriesResponse,
} from "@/lib/types/bulker";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";
import { getClientId } from "@/lib/utils";

export function useCreateBulkerEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBulkerEntryPayload) => {
      const res = await createBulkerEntryAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Bulker dispatch entry created successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to create dispatch entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}

export function useUpdateBulkerEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBulkerEntryPayload;
    }) => {
      const res = await updateBulkerEntryAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.all });
      const previousData = queryClient.getQueriesData<BulkerEntriesResponse>({
        queryKey: ["bulker", "entries"],
      });

      queryClient.setQueriesData<BulkerEntriesResponse>(
        { queryKey: ["bulker", "entries"] },
        (old) => {
          if (!old || !old.entries) return old;
          return {
            ...old,
            entries: old.entries.map((entry) => {
              if (entry.id !== id) return entry;
              return {
                ...entry,
                ...payload,
                salesOrderNumber:
                  payload.salesOrderNumber !== undefined
                    ? payload.salesOrderNumber !== null
                      ? String(payload.salesOrderNumber)
                      : null
                    : entry.salesOrderNumber,
                updatedAt: new Date().toISOString(),
              };
            }),
          };
        }
      );

      return { previousData };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}

export function useUpdateBulkerStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: BulkerStatus;
    }) => {
      const res = await updateBulkerStatusAction(id, status, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.all });
      const previousData = queryClient.getQueriesData<BulkerEntriesResponse>({
        queryKey: ["bulker", "entries"],
      });

      queryClient.setQueriesData<BulkerEntriesResponse>(
        { queryKey: ["bulker", "entries"] },
        (old) => {
          if (!old || !old.entries) return old;
          return {
            ...old,
            entries: old.entries.map((entry) => {
              if (entry.id !== id) return entry;
              const now = new Date().toISOString();
              const updated: BulkerEntry = {
                ...entry,
                status,
                updatedAt: now,
              };
              if (status === "VRA") {
                updated.customerName = "";
                updated.destination = "";
                updated.salesOrderNumber = null;
                updated.allocatedAt = null;
                updated.plantInAt = null;
                updated.plantOutAt = null;
              } else if (status === "ALLOCATED" && !updated.allocatedAt) {
                updated.allocatedAt = now;
              } else if (status === "SEND" && !updated.plantInAt) {
                updated.plantInAt = now;
              } else if (status === "OUT" && !updated.plantOutAt) {
                updated.plantOutAt = now;
              }
              return updated;
            }),
          };
        }
      );

      return { previousData };
    },
    onError: (error: any, _vars, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update status.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}

export function useDeleteBulkerEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBulkerEntryAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.all });
      const previousData = queryClient.getQueriesData<BulkerEntriesResponse>({
        queryKey: ["bulker", "entries"],
      });

      queryClient.setQueriesData<BulkerEntriesResponse>(
        { queryKey: ["bulker", "entries"] },
        (old) => {
          if (!old || !old.entries) return old;
          const filtered = old.entries.filter((entry) => entry.id !== id);
          const countDiff = old.entries.length - filtered.length;
          return {
            ...old,
            entries: filtered,
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  total: Math.max(0, old.pagination.total - countDiff),
                }
              : old.pagination,
          };
        }
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success("Bulker entry deleted successfully.");
    },
    onError: (error: any, _id, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}

export function useCreateBulkerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      bulkerNumber: string;
      transporterName: string;
      permit: string;
      isAllowed?: boolean;
    }) => {
      const res = await createBulkerInfoAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
      const previous = queryClient.getQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo()
      );
      const optimisticItem: BulkerInfo = {
        id: "temp-" + Date.now(),
        bulkerNumber: payload.bulkerNumber,
        transporterName: payload.transporterName,
        permit: payload.permit,
        isAllowed: payload.isAllowed ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo(),
        (old) => (old ? [optimisticItem, ...old] : [optimisticItem])
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Bulker master record added successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.bulkerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to add bulker master record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
    },
  });
}

export function useUpdateBulkerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        bulkerNumber?: string;
        transporterName?: string;
        permit?: string;
        isAllowed?: boolean;
      };
    }) => {
      const res = await updateBulkerInfoAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
      const previous = queryClient.getQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo()
      );
      queryClient.setQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo(),
        (old) =>
          old
            ? old.map((item) =>
                item.id === id
                  ? { ...item, ...payload, updatedAt: new Date().toISOString() }
                  : item
              )
            : old
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Bulker master record updated.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.bulkerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update bulker master record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
    },
  });
}

export function useDeleteBulkerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteBulkerInfoAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
      const previous = queryClient.getQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo()
      );
      queryClient.setQueryData<BulkerInfo[]>(
        QUERY_KEYS.bulker.bulkerInfo(),
        (old) => (old ? old.filter((item) => item.id !== id) : old)
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Bulker master record deleted.");
    },
    onError: (error: any, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.bulkerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete bulker record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.bulkerInfo() });
    },
  });
}

export function useCreateCustomerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { customerName: string; destination: string }) => {
      const res = await createCustomerInfoAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
      const previous = queryClient.getQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo()
      );
      const optimisticItem: CustomerInfo = {
        id: "temp-" + Date.now(),
        customerName: payload.customerName,
        destination: payload.destination,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo(),
        (old) => (old ? [optimisticItem, ...old] : [optimisticItem])
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Customer destination added successfully.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.customerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to add customer destination.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
    },
  });
}

export function useUpdateCustomerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: { customerName?: string; destination?: string };
    }) => {
      const res = await updateCustomerInfoAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
      const previous = queryClient.getQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo()
      );
      queryClient.setQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo(),
        (old) =>
          old
            ? old.map((item) =>
                item.id === id
                  ? { ...item, ...payload, updatedAt: new Date().toISOString() }
                  : item
              )
            : old
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Customer destination updated.");
    },
    onError: (error: any, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.customerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update customer destination.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
    },
  });
}

export function useDeleteCustomerInfoMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteCustomerInfoAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
      const previous = queryClient.getQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo()
      );
      queryClient.setQueryData<CustomerInfo[]>(
        QUERY_KEYS.bulker.customerInfo(),
        (old) => (old ? old.filter((item) => item.id !== id) : old)
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("Customer destination deleted.");
    },
    onError: (error: any, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.bulker.customerInfo(), context.previous);
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete customer destination.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.customerInfo() });
    },
  });
}

export function useBulkDeleteBulkerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteBulkerEntriesAction(ids, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.bulker.all });
      const idSet = new Set(ids);
      const previousData = queryClient.getQueriesData<BulkerEntriesResponse>({
        queryKey: ["bulker", "entries"],
      });

      queryClient.setQueriesData<BulkerEntriesResponse>(
        { queryKey: ["bulker", "entries"] },
        (old) => {
          if (!old || !old.entries) return old;
          const filtered = old.entries.filter((entry) => !idSet.has(entry.id));
          const countDiff = old.entries.length - filtered.length;
          return {
            ...old,
            entries: filtered,
            pagination: old.pagination
              ? {
                  ...old.pagination,
                  total: Math.max(0, old.pagination.total - countDiff),
                }
              : old.pagination,
          };
        }
      );

      return { previousData };
    },
    onSuccess: (data) => {
      toast.success(
        typeof data?.count === "number"
          ? `${data.count} entries deleted successfully.`
          : "Entries deleted successfully."
      );
    },
    onError: (error: any, _ids, context) => {
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete selected entries.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}

export function useCleanupBulkerExecuteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month_str: string) => {
      const res = await cleanupBulkerExecuteAction(month_str, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        typeof data?.count === "number"
          ? `Monthly cleanup completed. Purged ${data.count} entries.`
          : "Monthly cleanup completed successfully."
      );
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Monthly cleanup failed.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bulker.all });
    },
  });
}
