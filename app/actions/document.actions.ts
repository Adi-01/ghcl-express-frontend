"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";

/**
 * Uploads a KYC document (PDF <= 1MB) with document_type and optional document_number.
 */
export async function uploadDocumentAction(
  formData: FormData
): Promise<StandardActionResponse> {
  const file = formData.get("document_file") || formData.get("document");

  // Ensure document_file field exists for backend Multer compatibility
  if (file && !formData.has("document_file")) {
    formData.set("document_file", file);
  }

  return serverActionFetch("/api/v1/user-documents", {
    method: "POST",
    body: formData,
  });
}

/**
 * Updates a KYC document number or replaces the PDF file.
 * Resets verification_status to PENDING on the backend.
 */
export async function updateDocumentAction(
  docId: string,
  formData: FormData
): Promise<StandardActionResponse> {
  const file = formData.get("document_file") || formData.get("document");

  if (file && !formData.has("document_file")) {
    formData.set("document_file", file);
  }

  return serverActionFetch(`/api/v1/user-documents/${docId}`, {
    method: "PATCH",
    body: formData,
  });
}

/**
 * Soft deletes a user KYC document.
 */
export async function deleteDocumentAction(
  docId: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/user-documents/${docId}`, {
    method: "DELETE",
  });
}
