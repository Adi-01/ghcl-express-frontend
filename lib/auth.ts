import { jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { TOKEN_NAME } from "@/lib/constants";
import { env } from "@/config/env";

export interface SessionPayload {
  userId: string;
  labels: string[];
  is_admin: boolean;
  deviceInfo?: string;
}

/**
 * Decrypts a compact JWE session token using FRONTEND_SECRET_KEY.
 */
export async function decryptSessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = Buffer.from(env.FRONTEND_SECRET_KEY, "base64");
    const { payload } = await jwtDecrypt(token, secret);
    return {
      userId: (payload.userId || payload.user_id || payload.id) as string,
      labels: (payload.labels as string[]) || [],
      is_admin: Boolean(payload.is_admin || payload.isAdmin),
      deviceInfo: payload.deviceInfo as string | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Retrieves the session cookie value from request headers.
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

/**
 * Sets the httpOnly session cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
}

/**
 * Removes the session cookie on logout.
 */
export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

