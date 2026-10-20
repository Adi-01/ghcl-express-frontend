import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import type {
  BulkerEntriesResponse,
  BulkerInfo,
  CustomerInfo,
} from "@/lib/types/bulker";

export interface BulkerQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface AdminBulkerLogsParams {
  page?: number;
  limit?: number;
  status?: string;
  plant_out_at?: string;
  customer_name?: string;
  order_date?: string;
  search?: string;
}

/**
 * Hook to fetch Bulker Entries list for Employee views.
 * - Active: unpaginated live queue (VRA, ALLOCATED, SEND, HOLD).
 * - Unactive (status="unactive"): paginated records strictly for today in IST.
 * Note: Polling is explicitly DISABLED (refetchInterval: false) as real-time updates
 * are handled via Redis Pub/Sub + SSE invalidation signals.
 */
export function useBulkerEntriesQuery(params: BulkerQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<BulkerEntriesResponse>({
    queryKey: QUERY_KEYS.bulker.entries(params),
    queryFn: () =>
      reactQueryFetch<BulkerEntriesResponse>(
        `/api/bulkerdispatch/entries${queryString ? `?${queryString}` : ""}`
      ),
    placeholderData: (prev) => prev,
    refetchInterval: false,
  });
}

/**
 * Hook to fetch Administrative Bulker Dispatch Logs with full historical pagination,
 * status filters, and date filters.
 */
export function useAdminBulkerLogsQuery(params: AdminBulkerLogsParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.plant_out_at) queryParams.set("plant_out_at", params.plant_out_at);
  if (params.customer_name) queryParams.set("customer_name", params.customer_name);
  if (params.order_date) queryParams.set("order_date", params.order_date);
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<BulkerEntriesResponse>({
    queryKey: QUERY_KEYS.bulker.adminLogs(params),
    queryFn: () =>
      reactQueryFetch<BulkerEntriesResponse>(
        `/api/admin/bulkerdispatch/entries${queryString ? `?${queryString}` : ""}`
      ),
    placeholderData: (prev) => prev,
    refetchInterval: false,
  });
}

/**
 * Hook to fetch unpaginated Bulker master registry for autocomplete.
 */
export function useBulkerInfoQuery() {
  return useQuery<BulkerInfo[]>({
    queryKey: QUERY_KEYS.bulker.bulkerInfo(),
    queryFn: () =>
      reactQueryFetch<BulkerInfo[]>("/api/bulkerdispatch/bulker-info"),
  });
}

/**
 * Hook to fetch unpaginated Customer destinations master registry for autocomplete.
 */
export function useCustomerInfoQuery() {
  return useQuery<CustomerInfo[]>({
    queryKey: QUERY_KEYS.bulker.customerInfo(),
    queryFn: () =>
      reactQueryFetch<CustomerInfo[]>("/api/bulkerdispatch/customer-info"),
  });
}

/**
 * Hook to fetch the latest Sales Order number for a given customer.
 */
export function useCustomerLatestSOQuery(customerName: string) {
  return useQuery<{ salesOrderNumber: string | null }>({
    queryKey: ["bulker", "customer-latest-so", customerName],
    queryFn: () =>
      reactQueryFetch<{ salesOrderNumber: string | null }>(
        `/api/bulkerdispatch/customer-latest-so?customerName=${encodeURIComponent(customerName)}`
      ),
    enabled: Boolean(customerName && customerName.trim().length > 0),
  });
}

