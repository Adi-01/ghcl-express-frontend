"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  AttendancePunchPayload,
  AttendancePunchResponse,
} from "@/lib/types/attendance";

export async function punchAttendanceAction(
  payload: AttendancePunchPayload,
  clientId?: string
): Promise<StandardActionResponse<AttendancePunchResponse>> {
  return serverActionFetch<AttendancePunchResponse>("/api/v1/attendance/punch", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

