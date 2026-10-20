"use server";

import { serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";

export interface AdminCreateUserInput {
  email: string;
  password: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone_number?: string;
  emp_id?: string;
  designation?: string;
  labels?: string[];
  is_active?: boolean;
}

export interface AdminUpdateUserInput {
  email?: string;
  password?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone_number?: string;
  emp_id?: string;
  designation?: string;
  labels?: string[];
  is_active?: boolean;
}

/**
 * Admin action to create a new user.
 */
export async function adminCreateUserAction(
  input: AdminCreateUserInput
): Promise<StandardActionResponse> {
  const username =
    input.username ||
    `${input.first_name || ""} ${input.last_name || ""}`.trim() ||
    input.email.split("@")[0];

  const labels = input.labels || (input.role ? [input.role.toUpperCase()] : ["EMPLOYEE"]);

  const payload = {
    email: input.email,
    password: input.password,
    username,
    phone_number: input.phone_number,
    emp_id: input.emp_id,
    designation: input.designation,
    labels,
    is_active: input.is_active ?? true,
  };

  return serverActionFetch("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Admin action to update a user (labels, designation, is_active, password).
 */
export async function adminUpdateUserAction(
  userId: string,
  input: AdminUpdateUserInput
): Promise<StandardActionResponse> {
  const username =
    input.username ||
    (input.first_name || input.last_name
      ? `${input.first_name || ""} ${input.last_name || ""}`.trim()
      : undefined);

  const labels = input.labels || (input.role ? [input.role.toUpperCase()] : undefined);

  const payload: Record<string, any> = {};
  if (input.email) payload.email = input.email;
  if (input.password) payload.password = input.password;
  if (username) payload.username = username;
  if (input.phone_number !== undefined) payload.phone_number = input.phone_number;
  if (input.emp_id !== undefined) payload.emp_id = input.emp_id;
  if (input.designation !== undefined) payload.designation = input.designation;
  if (labels) payload.labels = labels;
  if (input.is_active !== undefined) payload.is_active = input.is_active;

  return serverActionFetch(`/api/v1/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Admin action to soft delete a user.
 */
export async function adminDeleteUserAction(
  userId: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/admin/users/${userId}`, {
    method: "DELETE",
  });
}

