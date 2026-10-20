"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  BulkerEntry,
  CreateBulkerEntryPayload,
  BulkerStatus,
} from "@/lib/types/bulker";

export async function createBulkerEntryAction(
  payload: CreateBulkerEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<BulkerEntry>> {
  return serverActionFetch<BulkerEntry>("/api/v1/bulkerdispatch/entries", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateBulkerStatusAction(
  id: string,
  status: BulkerStatus,
  clientId?: string
): Promise<StandardActionResponse<BulkerEntry>> {
  return serverActionFetch<BulkerEntry>(
    `/api/v1/bulkerdispatch/entries/${id}/status`,
    {
      method: "PATCH",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ status }),
    }
  );
}


