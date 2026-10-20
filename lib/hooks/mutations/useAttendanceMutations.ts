import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { punchAttendanceAction } from "@/app/actions/attendance.actions";
import {
  createAdminAttendanceAction,
  updateAdminAttendanceAction,
  deleteAdminAttendanceAction,
  bulkDeleteAttendanceAction,
  cleanupAttendanceAction,
} from "@/app/actions/admin-attendance.actions";
import type {
  AttendancePunchPayload,
  CreateAdminAttendancePayload,
  UpdateAdminAttendancePayload,
} from "@/lib/types/attendance";
import { toast } from "sonner";
import { isAuthRevocationError } from "@/lib/api/auth-error-handler";
import { getClientId } from "@/lib/utils";

/**
 * Mutation for Employee Punch (Check-in or Check-out)
 */
export function usePunchAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AttendancePunchPayload) => {
      const res = await punchAttendanceAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || (data?.action === "checked_in" ? "Checked in successfully." : "Checked out successfully."));
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to record attendance.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}

/**
 * Mutation for Admin manual shift creation
 */
export function useCreateAdminAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAdminAttendancePayload) => {
      const res = await createAdminAttendanceAction(payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Attendance record created successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to create attendance record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}

/**
 * Mutation for Admin shift update
 */
export function useUpdateAdminAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminAttendancePayload;
    }) => {
      const res = await updateAdminAttendanceAction(id, payload, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Attendance record updated successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to update attendance record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}

/**
 * Mutation for Admin single shift deletion
 */
export function useDeleteAdminAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteAdminAttendanceAction(id, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      toast.success("Attendance record deleted successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete attendance record.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}

/**
 * Mutation for Admin bulk delete
 */
export function useBulkDeleteAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await bulkDeleteAttendanceAction(ids, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || `Successfully deleted records.`);
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to delete selected records.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}

/**
 * Mutation for Admin month cleanup
 */
export function useCleanupAttendanceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (month_str: string) => {
      const res = await cleanupAttendanceAction(month_str, getClientId());
      if (!res.success) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Month cleanup completed successfully.");
    },
    onError: (error: any) => {
      if (isAuthRevocationError(error)) return;
      toast.error(error?.message || "Failed to execute month cleanup.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.attendance.all });
    },
  });
}
