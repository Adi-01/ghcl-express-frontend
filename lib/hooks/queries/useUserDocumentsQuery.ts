import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { DocumentItem } from "@/lib/types";

export function useUserDocumentsQuery(reveal: boolean = false) {
  return useQuery<DocumentItem[]>({
    queryKey: QUERY_KEYS.documents.userList(reveal),
    queryFn: () => reactQueryFetch<DocumentItem[]>(`/api/user-documents?reveal=${reveal}`),
  });
}

