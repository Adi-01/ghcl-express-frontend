import { ApiError } from "./ApiError";

/**
 * Browser-side fetch wrapper for React Query queryFn.
 * Calls Next.js BFF Route Handlers (/api/...).
 * Redirects to /login if 401 Unauthorized is returned.
 */
export async function reactQueryFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Session expired or unauthorized.", 401, "UNAUTHORIZED");
    }

    const message =
      json?.error?.message || json?.message || "Failed to fetch data.";
    const code = json?.error?.code || json?.code;
    const details = json?.error?.details || json?.error?.metadata;

    throw new ApiError(message, res.status, code, undefined, details);
  }

  if (json?.meta !== undefined) {
    return { data: json.data, meta: json.meta } as T;
  }

  return (json?.data !== undefined ? json.data : json) as T;
}
