"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  AttendanceLog,
  CreateAdminAttendancePayload,
  UpdateAdminAttendancePayload,
} from "@/lib/types/attendance";

export async function createAdminAttendanceAction(
  payload: CreateAdminAttendancePayload,
  clientId?: string
): Promise<StandardActionResponse<AttendanceLog>> {
  return serverActionFetch<AttendanceLog>("/api/v1/admin/attendance", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateAdminAttendanceAction(
  id: string,
  payload: UpdateAdminAttendancePayload,
  clientId?: string
): Promise<StandardActionResponse<AttendanceLog>> {
  return serverActionFetch<AttendanceLog>(`/api/v1/admin/attendance/${id}`, {
    method: "PATCH",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminAttendanceAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ message: string }>> {
  return serverActionFetch<{ message: string }>(`/api/v1/admin/attendance/${id}`, {
    method: "DELETE",
    headers: clientId ? { "x-client-id": clientId } : undefined,
  });
}

export async function bulkDeleteAttendanceAction(
  ids: string[],
  clientId?: string
): Promise<StandardActionResponse<{ count: number; message: string }>> {
  return serverActionFetch<{ count: number; message: string }>(
    "/api/v1/admin/attendance/bulk_delete",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ ids }),
    }
  );
}

export async function cleanupAttendanceAction(
  month_str: string,
  clientId?: string
): Promise<StandardActionResponse<{ count: number; message: string }>> {
  return serverActionFetch<{ count: number; message: string }>(
    "/api/v1/admin/attendance/cleanup_execute",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ month_str }),
    }
  );
}

