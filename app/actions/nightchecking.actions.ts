"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  TruckEntry,
  CreateTruckEntryPayload,
  UpdateTruckEntryPayload,
} from "@/lib/types/nightchecking";

export async function createTruckEntryAction(
  payload: CreateTruckEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<TruckEntry>> {
  return serverActionFetch<TruckEntry>("/api/v1/nightchecking/entries", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateTruckEntryAction(
  id: string,
  payload: UpdateTruckEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<TruckEntry>> {
  return serverActionFetch<TruckEntry>(`/api/v1/nightchecking/entries/${id}`, {
    method: "PATCH",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function markOutTruckAction(
  id: string,
  exitDate?: string | null,
  clientId?: string
): Promise<StandardActionResponse<TruckEntry>> {
  return serverActionFetch<TruckEntry>(
    `/api/v1/nightchecking/entries/${id}/mark_out`,
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ exit_date: exitDate }),
    }
  );
}

export async function deleteTruckEntryAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; message: string }>> {
  return serverActionFetch<{ success: boolean; message: string }>(
    `/api/v1/nightchecking/entries/${id}`,
    {
      method: "DELETE",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

