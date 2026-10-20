"use server";

import { coreFetch, serverActionFetch, StandardActionResponse } from "@/lib/api/fetchers";
import { setSessionCookie, removeSessionCookie, decryptSessionToken } from "@/lib/auth";

export interface LoginActionInput {
  email: string;
  password: string;
  device_info?: string;
}

export type LoginInput = LoginActionInput;

/**
 * Server Action for User Login.
 * Handles session token acquisition and HTTP-only session cookie persistence.
 */
export async function loginAction(
  input: LoginActionInput
): Promise<StandardActionResponse<{ is_admin: boolean; user: { role: "ADMIN" | "EMPLOYEE" } }>> {
  try {
    const res = await coreFetch<{ session_token: string; expires_at: string }>(
      "/api/v1/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          device_info: input.device_info || "Desktop Browser",
        }),
      }
    );

    const token = res.data.session_token;
    await setSessionCookie(token);

    const session = await decryptSessionToken(token);
    const isAdmin = Boolean(session?.is_admin);

    return {
      success: true,
      data: {
        is_admin: isAdmin,
        user: { role: isAdmin ? "ADMIN" : "EMPLOYEE" },
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || "AUTH_ERROR",
        message: error.message || "Login failed.",
        statusCode: error.statusCode || 400,
        details: error.details,
      },
    };
  }
}

/**
 * Server Action for Logout.
 * Informs backend, evicts active session token, clears cookie, and redirects to /login.
 */
export async function logoutAction(): Promise<StandardActionResponse<{ loggedOut: boolean }>> {
  try {
    await coreFetch("/api/v1/auth/logout", {
      method: "POST",
    });
  } catch {
    // Non-blocking logout network failure
  } finally {
    await removeSessionCookie();
  }
  return { success: true, data: { loggedOut: true } };
}

/**
 * Admin action to revoke a specific user session.
 */
export async function revokeSessionAction(
  userId: string,
  sessionKey: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/admin/users/${userId}/revoke-session`, {
    method: "POST",
    body: JSON.stringify({ session_key: sessionKey }),
  });
}

/**
 * Admin action to mass revoke all sessions for a user.
 */
export async function revokeAllSessionsAction(
  userId: string
): Promise<StandardActionResponse> {
  return serverActionFetch(`/api/v1/admin/users/${userId}/revoke-all-sessions`, {
    method: "POST",
  });
}

