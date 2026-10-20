import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import {
  createTruckEntryAction,
  updateTruckEntryAction,
  markOutTruckAction,
  deleteTruckEntryAction,
} from "@/app/actions/nightchecking.actions";
import {
  createAdminTruckEntryAction,
  updateAdminTruckEntryAction,
  deleteAdminTruckEntryAction,
  bulkDeleteTruckEntriesAction,
  cleanupNightCheckingExecuteAction,
} from "@/app/actions/admin-nightchecking.actions";
import type {
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";
import { getClientId } from "@/lib/utils";

/**
 * Mutation for Employee truck check-in
 */
export function useCreateTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTruckEntryPayload) => {
      const res = await createTruckEntryAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Truck entry created successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to create truck entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

/**
 * Mutation for Employee truck entry update
 */
export function useUpdateTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTruckEntryPayload;
    }) => {
      const res = await updateTruckEntryAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Truck entry updated successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update truck entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

/**
 * Mutation for marking out a truck
 */
export function useMarkOutTruckMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      exitDate,
    }: {
      id: string;
      exitDate?: string | null;
    }) => {
      const res = await markOutTruckAction(id, exitDate, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Truck marked out successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to mark out truck.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

/**
 * Mutation for deleting a truck entry
 */
export function useDeleteTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteTruckEntryAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Truck entry deleted successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete truck entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

/**
 * Admin Mutations
 */
export function useCreateAdminTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTruckEntryPayload) => {
      const res = await createAdminTruckEntryAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Admin truck entry created successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to create entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

export function useUpdateAdminTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTruckEntryPayload;
    }) => {
      const res = await updateAdminTruckEntryAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Admin truck entry updated successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

export function useDeleteAdminTruckEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAdminTruckEntryAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Truck entry deleted.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete entry.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

export function useBulkDeleteTruckEntriesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteTruckEntriesAction(ids, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        data?.count
          ? `Successfully deleted ${data.count} truck entries.`
          : "Selected truck entries deleted."
      );
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Bulk delete failed.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

export function useCleanupNightCheckingExecuteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month_str: string) => {
      const res = await cleanupNightCheckingExecuteAction(month_str, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(
        data?.count
          ? `Successfully purged ${data.count} records.`
          : "Monthly cleanup executed successfully."
      );
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Cleanup execution failed.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.nightchecking.all });
    },
  });
}

// Aliases matching legacy mutation signatures
export const useCreateTruckEntry = useCreateTruckEntryMutation;
export const useUpdateTruckEntry = useUpdateTruckEntryMutation;
export const useCreateAdminTruckEntry = useCreateAdminTruckEntryMutation;
export const useUpdateAdminTruckEntry = useUpdateAdminTruckEntryMutation;
export const useBulkDeleteAdminTruckEntries = useBulkDeleteTruckEntriesMutation;

