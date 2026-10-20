"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  MutationCache,
  QueryCache,
} from "@tanstack/react-query";
import {
  isAuthRevocationError,
  handleAuthRevocation,
} from "@/lib/api/auth-error-handler";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onError: (error: any) => {
            if (isAuthRevocationError(error)) {
              handleAuthRevocation(error);
            }
          },
        }),
        queryCache: new QueryCache({
          onError: (error: any) => {
            if (isAuthRevocationError(error)) {
              handleAuthRevocation(error);
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            gcTime: 60 * 60 * 1000, // 1 hour warm cache
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              if (isAuthRevocationError(error)) return false;
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

