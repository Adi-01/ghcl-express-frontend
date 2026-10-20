import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { PaginatedResponse, User, Session } from "@/lib/types";

export interface AdminUsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
}

export function useAdminUsersListQuery(params: AdminUsersQueryParams = {}) {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);
  if (params.role) queryParams.set("role", params.role);
  if (params.is_active !== undefined) queryParams.set("is_active", String(params.is_active));

  const queryString = queryParams.toString();

  return useQuery<PaginatedResponse<User>>({
    queryKey: QUERY_KEYS.admin.users.list(params),
    queryFn: () =>
      reactQueryFetch<PaginatedResponse<User>>(
        `/api/admin/users${queryString ? `?${queryString}` : ""}`
      ),
  });
}

export function useAdminUserDetailQuery(id: string, reveal: boolean = false) {
  return useQuery<User>({
    queryKey: QUERY_KEYS.admin.users.detail(id, reveal),
    queryFn: () =>
      reactQueryFetch<User>(`/api/admin/users/${id}?reveal=${reveal}`),
    enabled: Boolean(id),
  });
}

export function useAdminUserSessionsQuery(id: string) {
  return useQuery<Session[]>({
    queryKey: QUERY_KEYS.admin.users.sessions(id),
    queryFn: () => reactQueryFetch<Session[]>(`/api/admin/users/${id}/sessions`),
    enabled: Boolean(id),
  });
}

export function useAdminUsersDropdownQuery(search?: string) {
  return useQuery<Array<{ id: string; email: string; first_name: string; last_name: string }>>({
    queryKey: QUERY_KEYS.admin.users.dropdown(search),
    queryFn: () =>
      reactQueryFetch<Array<{ id: string; email: string; first_name: string; last_name: string }>>(
        `/api/admin/users/dropdown${search ? `?search=${encodeURIComponent(search)}` : ""}`
      ),
  });
}

