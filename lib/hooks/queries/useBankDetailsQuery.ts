import { useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { reactQueryFetch } from "@/lib/api/clientFetchers";
import { BankDetails } from "@/lib/types";

export function useBankDetailsQuery(reveal: boolean = false) {
  return useQuery<BankDetails | null>({
    queryKey: QUERY_KEYS.bankDetails.detail(reveal),
    queryFn: () => reactQueryFetch<BankDetails | null>(`/api/user-bank-details?reveal=${reveal}`),
  });
}

