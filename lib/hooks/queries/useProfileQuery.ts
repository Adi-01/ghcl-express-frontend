import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { User } from "@/lib/types";

export function useProfileQuery(reveal: boolean = false) {
  return useQuery<User>({
    queryKey: QUERY_KEYS.profile.detail(reveal),
    queryFn: () => reactQueryFetch<User>(`/api/my-profile?reveal=${reveal}`),
    placeholderData: (prev) => prev,
  });
}
