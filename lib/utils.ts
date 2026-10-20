export { cn } from "cn";

/**
 * Formats ISO date-time string in IST timezone (Asia/Kolkata).
 */
export function formatDateTime(
  isoString?: string | null,
  format: "date" | "time" | "full" = "full"
): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "-";

  if (format === "date") {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }

  if (format === "time") {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Returns human-readable relative time (e.g. "5 mins ago", "2 hours ago").
 */
export function formatRelativeTime(isoString?: string | null): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;

  return formatDateTime(isoString, "date");
}

/**
 * Mask sensitive numbers showing only the last 4 characters.
 */
export function maskSensitive(val?: string | null): string {
  if (!val) return "-";
  const str = String(val).trim();
  if (str.length <= 4) return str;
  return "*".repeat(str.length - 4) + str.slice(-4);
}

const CLIENT_ID_KEY = "ghcl_client_id";

/**
 * Retrieves the current session's client identifier.
 * If missing, generates a unique UUID, persists it in sessionStorage, and returns it.
 */
export function getClientId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }

  try {
    let id = window.sessionStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `client_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
      window.sessionStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return "client_fallback";
  }
}

/**
 * Formatted date & time parts object for tabular duration displays.
 */
export const formatDateTimeObject = (isoString?: string | null) => {
  if (!isoString) return "-";
  return {
    date: formatDateTime(isoString, "date"),
    time: formatDateTime(isoString, "time"),
    full: formatDateTime(isoString, "full"),
  };
};

/**
 * Calculates elapsed standby duration and checks if it exceeds 3 hours (180 mins).
 */
export const getDurationInfo = (
  inTime?: string | null,
  outTime?: string | null
) => {
  if (!inTime) return { text: "-", isOverLimit: false, diffMins: 0 };

  const start = new Date(inTime).getTime();
  const end = outTime ? new Date(outTime).getTime() : new Date().getTime();

  const diffMs = end - start;
  if (diffMs < 0 || isNaN(diffMs)) return { text: "-", isOverLimit: false, diffMins: 0 };

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  const isOverLimit = diffMins > 180;
  return { text: `${hours}h ${mins}m`, isOverLimit, diffMins };
};
