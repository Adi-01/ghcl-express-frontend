"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  TruckEntry,
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";

export async function createAdminTruckEntryAction(
  payload: CreateTruckEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<TruckEntry>> {
  return serverActionFetch<TruckEntry>("/api/v1/admin/nightchecking/entries", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateAdminTruckEntryAction(
  id: string,
  payload: UpdateTruckEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<TruckEntry>> {
  return serverActionFetch<TruckEntry>(
    `/api/v1/admin/nightchecking/entries/${id}`,
    {
      method: "PATCH",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteAdminTruckEntryAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; message: string }>> {
  return serverActionFetch<{ success: boolean; message: string }>(
    `/api/v1/admin/nightchecking/entries/${id}`,
    {
      method: "DELETE",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function bulkDeleteTruckEntriesAction(
  ids: string[],
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; count: number }>> {
  return serverActionFetch<{ success: boolean; count: number }>(
    "/api/v1/admin/nightchecking/entries/bulk_delete",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ ids }),
    }
  );
}

export async function cleanupNightCheckingPreviewAction(
  month_str: string,
  clientId?: string
): Promise<StandardActionResponse<{ count: number }>> {
  const query = new URLSearchParams({ month_str }).toString();
  return serverActionFetch<{ count: number }>(
    `/api/v1/admin/nightchecking/entries/cleanup_preview?${query}`,
    {
      method: "GET",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function cleanupNightCheckingExecuteAction(
  month_str: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; count: number }>> {
  return serverActionFetch<{ success: boolean; count: number }>(
    "/api/v1/admin/nightchecking/entries/cleanup_execute",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ month_str }),
    }
  );
}

