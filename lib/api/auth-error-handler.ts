import { logoutAction } from "@/app/actions/auth.actions";
import { toast } from "sonner";

/**
 * Checks if an error corresponds to session invalidation, revocation, expiration, or account blockage.
 * User requirement: "if mutations recieve 401 or 409 with the code session invalid or account blocked then they should logout too"
 */
export function isAuthRevocationError(error: any): boolean {
  if (!error) return false;

  const status = error.statusCode || error.status_code || error.status;
  const code = String(error.code || "").toLowerCase();
  const message = String(error.message || "").toLowerCase();

  const isMatchingStatus = status === 401 || status === 409 || status === 403;

  const isSessionInvalid =
    code.includes("session_invalid") ||
    code.includes("session invalid") ||
    code.includes("invalid_token") ||
    code.includes("session_expired") ||
    code.includes("session_conflict") ||
    code.includes("device_limit_reached") ||
    code === "unauthorized" ||
    message.includes("session invalid") ||
    message.includes("invalid token") ||
    message.includes("session revoked") ||
    message.includes("session expired") ||
    message.includes("session has expired") ||
    message.includes("session conflict");

  const isAccountBlocked =
    code.includes("account_blocked") ||
    code.includes("account blocked") ||
    message.includes("account has been blocked") ||
    message.includes("account blocked") ||
    message.includes("blocked by an administrator");

  if (isMatchingStatus && (isSessionInvalid || isAccountBlocked)) {
    return true;
  }

  // Any explicit 401 should trigger logout
  if (status === 401) {
    return true;
  }

  return false;
}

let isLoggingOut = false;

/**
 * Performs client-side session eviction and redirects to /login on auth revocation.
 */
export async function handleAuthRevocation(error: any) {
  if (isLoggingOut) return;
  isLoggingOut = true;

  const message = String(error?.message || "").toLowerCase();
  const code = String(error?.code || "").toLowerCase();
  const isBlocked = message.includes("blocked") || code.includes("blocked");

  if (isBlocked) {
    toast.error("Your account has been blocked by an administrator.");
  } else {
    toast.error("Your session is invalid or has expired. Please log in again.");
  }

  try {
    await logoutAction();
  } catch {
    // Non-blocking logout failure
  }

  if (typeof window !== "undefined") {
    window.location.href = isBlocked
      ? "/login?error=account_blocked"
      : "/login?error=session_expired";
  }
}

