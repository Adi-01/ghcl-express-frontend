"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import type { BankDetailsInput } from "./profile.actions";

export interface AdminUpsertBankDetailsInput extends BankDetailsInput {
  user_id: string;
  is_verified?: boolean;
}

/**
 * Admin action to upsert bank details for a target user.
 */
export async function adminUpsertBankDetailsAction(
  userIdOrInput: string | AdminUpsertBankDetailsInput,
  maybeInput?: BankDetailsInput
): Promise<StandardActionResponse> {
  const userId = typeof userIdOrInput === "string" ? userIdOrInput : userIdOrInput.user_id;
  const input = typeof userIdOrInput === "string" ? maybeInput! : userIdOrInput;

  return serverActionFetch(`/api/v1/admin/bank-details/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

/**
 * Admin action to soft delete bank details for a target user.
 */
export async function adminDeleteBankDetailsAction(
  userId: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/admin/bank-details/users/${userId}`, {
    method: "DELETE",
  });
}

