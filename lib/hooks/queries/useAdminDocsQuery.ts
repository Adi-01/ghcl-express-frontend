import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { PaginatedResponse, DocumentItem, DocumentStatistics } from "@/lib/types";

export interface AdminDocsQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  document_type?: string;
  user_id?: string;
  search?: string;
}

export function useAdminDocsListQuery(params: AdminDocsQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.status) queryParams.set("status", params.status);
  if (params.document_type) queryParams.set("document_type", params.document_type);
  if (params.user_id) queryParams.set("user_id", params.user_id);
  if (params.search) queryParams.set("search", params.search);

  const queryString = queryParams.toString();

  return useQuery<PaginatedResponse<DocumentItem>>({
    queryKey: QUERY_KEYS.admin.documents.list(params),
    queryFn: () =>
      reactQueryFetch<PaginatedResponse<DocumentItem>>(
        `/api/admin/documents${queryString ? `?${queryString}` : ""}`
      ),
  });
}

export function useAdminDocStatsQuery() {
  return useQuery<DocumentStatistics>({
    queryKey: QUERY_KEYS.admin.documents.statistics,
    queryFn: () => reactQueryFetch<DocumentStatistics>("/api/admin/documents/statistics"),
  });
}

export function useAdminUserDocsQuery(userId: string, reveal: boolean = false) {
  return useQuery<DocumentItem[]>({
    queryKey: QUERY_KEYS.admin.documents.byUser(userId, reveal),
    queryFn: () =>
      reactQueryFetch<DocumentItem[]>(`/api/admin/documents/user/${userId}?reveal=${reveal}`),
    enabled: Boolean(userId),
  });
}

