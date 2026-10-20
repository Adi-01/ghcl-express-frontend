"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type {
  BulkerEntry,
  BulkerInfo,
  CustomerInfo,
  UpdateBulkerEntryPayload,
} from "@/lib/types/bulker";

export async function updateBulkerEntryAction(
  id: string,
  payload: UpdateBulkerEntryPayload,
  clientId?: string
): Promise<StandardActionResponse<BulkerEntry>> {
  return serverActionFetch<BulkerEntry>(`/api/v1/bulkerdispatch/entries/${id}`, {
    method: "PATCH",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function deleteBulkerEntryAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; message: string }>> {
  return serverActionFetch<{ success: boolean; message: string }>(
    `/api/v1/bulkerdispatch/entries/${id}`,
    {
      method: "DELETE",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function createBulkerInfoAction(
  payload: {
    bulkerNumber: string;
    transporterName: string;
    permit: string;
    isAllowed?: boolean;
  },
  clientId?: string
): Promise<StandardActionResponse<BulkerInfo>> {
  return serverActionFetch<BulkerInfo>("/api/v1/bulkerdispatch/bulker-info", {
    method: "POST",
    headers: clientId ? { "x-client-id": clientId } : undefined,
    body: JSON.stringify(payload),
  });
}

export async function updateBulkerInfoAction(
  id: string,
  payload: {
    bulkerNumber?: string;
    transporterName?: string;
    permit?: string;
    isAllowed?: boolean;
  },
  clientId?: string
): Promise<StandardActionResponse<BulkerInfo>> {
  return serverActionFetch<BulkerInfo>(
    `/api/v1/bulkerdispatch/bulker-info/${id}`,
    {
      method: "PATCH",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteBulkerInfoAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; message: string }>> {
  return serverActionFetch<{ success: boolean; message: string }>(
    `/api/v1/bulkerdispatch/bulker-info/${id}`,
    {
      method: "DELETE",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function createCustomerInfoAction(
  payload: {
    customerName: string;
    destination: string;
  },
  clientId?: string
): Promise<StandardActionResponse<CustomerInfo>> {
  return serverActionFetch<CustomerInfo>(
    "/api/v1/bulkerdispatch/customer-info",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify(payload),
    }
  );
}

export async function updateCustomerInfoAction(
  id: string,
  payload: {
    customerName?: string;
    destination?: string;
  },
  clientId?: string
): Promise<StandardActionResponse<CustomerInfo>> {
  return serverActionFetch<CustomerInfo>(
    `/api/v1/bulkerdispatch/customer-info/${id}`,
    {
      method: "PATCH",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteCustomerInfoAction(
  id: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; message: string }>> {
  return serverActionFetch<{ success: boolean; message: string }>(
    `/api/v1/bulkerdispatch/customer-info/${id}`,
    {
      method: "DELETE",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function bulkDeleteBulkerEntriesAction(
  ids: string[],
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; count: number }>> {
  return serverActionFetch<{ success: boolean; count: number }>(
    "/api/v1/admin/bulkerdispatch/data/bulk_delete",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ ids }),
    }
  );
}

export async function cleanupBulkerPreviewAction(
  month_str: string,
  clientId?: string
): Promise<StandardActionResponse<{ count: number }>> {
  const query = new URLSearchParams({ month_str }).toString();
  return serverActionFetch<{ count: number }>(
    `/api/v1/admin/bulkerdispatch/data/cleanup_preview?${query}`,
    {
      method: "GET",
      headers: clientId ? { "x-client-id": clientId } : undefined,
    }
  );
}

export async function cleanupBulkerExecuteAction(
  month_str: string,
  clientId?: string
): Promise<StandardActionResponse<{ success: boolean; count: number }>> {
  return serverActionFetch<{ success: boolean; count: number }>(
    "/api/v1/admin/bulkerdispatch/data/cleanup_execute",
    {
      method: "POST",
      headers: clientId ? { "x-client-id": clientId } : undefined,
      body: JSON.stringify({ month_str }),
    }
  );
}
