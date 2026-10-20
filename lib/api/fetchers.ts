import "server-only";
import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { getSessionCookie, removeSessionCookie } from "@/lib/auth";
import { ApiError } from "./ApiError";

export interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
  token?: string;
}

export interface StandardActionResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: any;
  message?: string;
  error?: {
    code?: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

/**
 * Core internal server-side fetcher proxying requests to the Express backend.
 * Automatically injects Jwt-Secret-Key, Bearer session token, and client tracing headers.
 */
export async function coreFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<{ status: number; data: T; meta?: any }> {
  const token = options.token || (await getSessionCookie());

  const headers: Record<string, string> = {
    "Jwt-Secret-Key": env.FRONTEND_SECRET_KEY,
    ...(options.headers || {}),
  };

  // If body is NOT FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const reqHeaders = await nextHeaders();
    const userAgent = reqHeaders.get("user-agent");
    if (userAgent && !headers["x-forwarded-user-agent"]) {
      headers["x-forwarded-user-agent"] = userAgent;
    }
    const clientDevice = reqHeaders.get("x-client-device");
    if (clientDevice && !headers["x-client-device"]) {
      headers["x-client-device"] = clientDevice;
    }
  } catch {
    // nextHeaders() throws if called outside a Next.js request lifecycle
  }

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${env.BACKEND_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = {};
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!response.ok) {
    const errorMessage =
      json?.error?.message || json?.message || "An unexpected error occurred.";
    const errorCode = json?.error?.code || json?.code;
    const errorType = json?.error?.type;
    const details = json?.error?.metadata || json?.error?.details || json?.metadata;

    throw new ApiError(
      errorMessage,
      response.status,
      errorCode,
      errorType,
      details
    );
  }

  return {
    status: response.status,
    data: (json?.data !== undefined ? json.data : json) as T,
    meta: json?.meta,
  };
}

/**
 * Server Action wrapper. Catches ApiError and returns a standardized response object.
 * Re-throws NEXT_REDIRECT signals and clears cookies on 401.
 */
export async function serverActionFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<StandardActionResponse<T>> {
  try {
    const res = await coreFetch<T>(endpoint, options);
    return {
      success: true,
      data: res.data,
      meta: res.meta,
    };
  } catch (error: any) {
    if (error?.message === "NEXT_REDIRECT") {
      throw error;
    }

    if (error instanceof ApiError) {
      const codeStr = String(error.code || "").toLowerCase();
      const msgStr = String(error.message || "").toLowerCase();
      const isAuthRevocation =
        error.statusCode === 401 ||
        (error.statusCode === 409 &&
          (codeStr.includes("session") ||
           msgStr.includes("session") ||
           codeStr.includes("blocked") ||
           msgStr.includes("blocked"))) ||
        (error.statusCode === 403 &&
          (codeStr.includes("blocked") || msgStr.includes("blocked")));

      if (isAuthRevocation) {
        await removeSessionCookie();
      }

      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          details: error.details,
        },
      };
    }

    return {
      success: false,
      error: {
        message: error?.message || "Internal server error",
        statusCode: 500,
      },
    };
  }
}

/**
 * Route Handler wrapper for GET proxies.
 */
export async function routeHandlerFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<NextResponse> {
  try {
    const res = await coreFetch<T>(endpoint, options);
    return NextResponse.json({
      status: "success",
      data: res.data,
      meta: res.meta,
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      const codeStr = String(error.code || "").toLowerCase();
      const msgStr = String(error.message || "").toLowerCase();
      const isAuthRevocation =
        error.statusCode === 401 ||
        (error.statusCode === 409 &&
          (codeStr.includes("session") ||
           msgStr.includes("session") ||
           codeStr.includes("blocked") ||
           msgStr.includes("blocked"))) ||
        (error.statusCode === 403 &&
          (codeStr.includes("blocked") || msgStr.includes("blocked")));

      if (isAuthRevocation) {
        await removeSessionCookie();
      }

      return NextResponse.json(
        {
          status: "error",
          error: {
            code: error.code,
            message: error.message,
            status_code: error.statusCode,
            details: error.details,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        status: "error",
        error: {
          message: error?.message || "Internal server error",
          status_code: 500,
        },
      },
      { status: 500 }
    );
  }
}
