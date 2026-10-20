import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import type {
  NightCheckingEntriesResponse,
} from "@/lib/types/nightchecking";

export interface NightCheckingQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminNightCheckingLogsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  date?: string;
}

/**
 * Hook to fetch Night Checking Entries for Employee view.
 * If status === "IN", returns unpaginated live active trucks.
 * If status === "OUT", returns paginated historical records.
 */
export function useNightCheckingEntriesQuery(
  params: NightCheckingQueryParams = {}
) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<NightCheckingEntriesResponse>({
    queryKey: QUERY_KEYS.nightchecking.entries(params),
    queryFn: () =>
      reactQueryFetch<NightCheckingEntriesResponse>(
        `/api/nightchecking/entries${queryString ? `?${queryString}` : ""}`
      ),
    placeholderData: (prev) => prev,
    refetchInterval: false,
  });
}

/**
 * Hook to fetch distinct active transporter names for autocomplete.
 */
export function useNightCheckingTransportersQuery() {
  return useQuery<string[]>({
    queryKey: QUERY_KEYS.nightchecking.transporters(),
    queryFn: () => reactQueryFetch<string[]>("/api/nightchecking/transporters"),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

/**
 * Hook to fetch Administrative Night Checking Logs with full historical pagination.
 */
export function useAdminNightCheckingLogsQuery(
  params: AdminNightCheckingLogsParams = {}
) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.date) queryParams.set("date", params.date);
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<NightCheckingEntriesResponse>({
    queryKey: QUERY_KEYS.nightchecking.adminLogs(params),
    queryFn: () =>
      reactQueryFetch<NightCheckingEntriesResponse>(
        `/api/admin/nightchecking/entries${queryString ? `?${queryString}` : ""}`
      ),
    placeholderData: (prev) => prev,
    refetchInterval: false,
  });
}

// Aliases matching legacy query signatures
export function useNightCheckingLogs(
  page: number = 1,
  status: "IN" | "OUT" = "IN",
  initialData?: any
) {
  return useNightCheckingEntriesQuery({ page, status, limit: 20 });
}

export function useAdminNightCheckingLogs(
  page: number = 1,
  status?: string,
  search?: string,
  initialData?: any
) {
  return useAdminNightCheckingLogsQuery({ page, status, search, limit: 25 });
}

export const useTransporters = useNightCheckingTransportersQuery;

