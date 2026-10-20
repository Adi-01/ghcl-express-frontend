import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import type {
  AttendanceDashboardStatusResponse,
  AdminAttendanceLogsResponse,
  AttendanceRegisterResponse,
} from "@/lib/types/attendance";

export interface AdminAttendanceLogsParams {
  page?: number;
  limit?: number;
  date?: string;
  month?: string;
  worklocation?: string;
  search?: string;
}

/**
 * Hook to fetch Attendance Status for Employee Dashboard
 */
export function useAttendanceStatusQuery() {
  return useQuery<AttendanceDashboardStatusResponse>({
    queryKey: QUERY_KEYS.attendance.status(),
    queryFn: () =>
      reactQueryFetch<AttendanceDashboardStatusResponse>("/api/attendance/status"),
  });
}

/**
 * Hook to fetch Attendance Shift Logs for Admin view
 */
export function useAdminAttendanceLogsQuery(
  params: AdminAttendanceLogsParams = {}
) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.date) queryParams.set("date", params.date);
  if (params.month) queryParams.set("month", params.month);
  if (params.worklocation && params.worklocation !== "all") {
    queryParams.set("worklocation", params.worklocation);
  }
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<AdminAttendanceLogsResponse>({
    queryKey: QUERY_KEYS.attendance.adminLogs(params),
    queryFn: () =>
      reactQueryFetch<AdminAttendanceLogsResponse>(
        `/api/admin/attendance/entries${queryString ? `?${queryString}` : ""}`
      ),
    placeholderData: (prev) => prev,
  });
}

/**
 * Hook to fetch Monthly Attendance Register Matrix for Admin view
 */
export function useAttendanceRegisterQuery(
  month?: string,
  worklocation?: string
) {
  const queryParams = new URLSearchParams();
  if (month) queryParams.set("month", month);
  if (worklocation && worklocation !== "all") {
    queryParams.set("worklocation", worklocation);
  }

  const queryString = queryParams.toString();

  return useQuery<AttendanceRegisterResponse>({
    queryKey: QUERY_KEYS.attendance.register(month, worklocation),
    queryFn: () =>
      reactQueryFetch<AttendanceRegisterResponse>(
        `/api/admin/attendance/register${queryString ? `?${queryString}` : ""}`
      ),
  });
}

/**
 * Hook to preview records count before month cleanup
 */
export function useAttendanceCleanupPreviewQuery(
  month_str: string,
  enabled: boolean = false
) {
  return useQuery<{ month: string; count: number }>({
    queryKey: QUERY_KEYS.attendance.cleanupPreview(month_str),
    queryFn: () =>
      reactQueryFetch<{ month: string; count: number }>(
        `/api/admin/attendance/cleanup_preview?month_str=${encodeURIComponent(month_str)}`
      ),
    enabled: Boolean(enabled && month_str),
  });
}

