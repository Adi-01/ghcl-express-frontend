"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";

export interface AdminUpdateDocStatusInput {
  status: "APPROVED" | "REJECTED";
  rejection_reason?: string;
}

/**
 * Admin action to approve or reject a single document.
 */
export async function adminUpdateDocumentStatusAction(
  docId: string,
  statusOrData: "APPROVED" | "REJECTED" | AdminUpdateDocStatusInput
): Promise<StandardActionResponse> {
  const payload = typeof statusOrData === "string" ? { status: statusOrData } : statusOrData;

  return serverActionFetch(`/api/v1/admin/documents/${docId}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Admin action to bulk approve an array of documents.
 */
export async function adminBulkApproveAction(
  documentIds: string[]
): Promise<StandardActionResponse> {
  return serverActionFetch("/api/v1/admin/documents/bulk-approve", {
    method: "POST",
    body: JSON.stringify({ document_ids: documentIds }),
  });
}

/**
 * Admin action to bulk reject an array of documents.
 */
export async function adminBulkRejectAction(
  documentIds: string[],
  remarks?: string
): Promise<StandardActionResponse> {
  return serverActionFetch("/api/v1/admin/documents/bulk-reject", {
    method: "POST",
    body: JSON.stringify({ document_ids: documentIds, remarks }),
  });
}

/**
 * Admin action to delete a document (purges Cloudinary asset and soft-deletes record).
 */
export async function adminDeleteDocumentAction(
  docId: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/admin/documents/${docId}`, {
    method: "DELETE",
  });
}

