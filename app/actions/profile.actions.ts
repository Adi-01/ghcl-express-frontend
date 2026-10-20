"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";

export interface UpdateProfileInput {
  username?: string;
  phone_number?: string;
}

export interface BankDetailsInput {
  bank_name: string;
  branch_name?: string | null;
  account_holder_name: string;
  ifsc_code: string;
  account_type?: "SAVINGS" | "CURRENT" | "SALARY";
  account_number?: string;
}

/**
 * Updates authenticated employee contact details.
 */
export async function updateProfileAction(
  input: UpdateProfileInput
): Promise<StandardActionResponse> {
  const payload: Record<string, any> = {};
  if (input.username !== undefined) payload.username = input.username;
  if (input.phone_number !== undefined) payload.phone_number = input.phone_number;

  return serverActionFetch("/api/v1/my-profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Creates bank details for authenticated employee.
 */
export async function createBankDetailsAction(
  input: BankDetailsInput
): Promise<StandardActionResponse> {
  return serverActionFetch("/api/v1/user-bank-details/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/**
 * Updates bank details for authenticated employee.
 */
export async function updateBankDetailsAction(
  input: Partial<BankDetailsInput>
): Promise<StandardActionResponse> {
  return serverActionFetch("/api/v1/user-bank-details", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

/**
 * Soft deletes bank details for authenticated employee.
 */
export async function deleteBankDetailsAction(): Promise<StandardActionResponse> {
  return serverActionFetch("/api/v1/user-bank-details", {
    method: "DELETE",
  });
}
