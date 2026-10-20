"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import { getClientId } from "@/lib/utils";

/**
 * Real-Time Server-Sent Events (SSE) hook for Bulker Dispatch invalidation.
 *
 * SCOPE CONSTRAINT (MANDATORY):
 * This hook is exclusively mounted on the /bulkerentries route (BulkerEntriesClient.tsx).
 * It listens to lightweight signals from Redis Pub/Sub via the Express SSE endpoint.
 * When a signal arrives, it invalidates the active React Query cache, triggering
 * an instant, seamless background refetch without streaming bulky payloads.
 *
 * ECHO SUPPRESSION:
 * If the incoming event originated from this exact browser tab (data.clientId === currentClientId),
 * the SSE invalidation is skipped because the local mutation's onSettled handler already authoritatively
 * invalidates and refetches, eliminating duplicate GET requests.
 */
export function useBulkerSSE() {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connectSSE = () => {
      try {
        const es = new EventSource("/api/bulkerdispatch/events");
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "BULKER_INVALIDATE") {
              const currentClientId = getClientId();
              if (data.clientId && data.clientId === currentClientId) {
                // Echo suppression: originated by this tab, already invalidated locally
                return;
              }

              // Invalidate dispatch entries list for all other tabs/operators
              queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.bulker.all,
              });
            }
          } catch {
            // Heartbeats / keep-alive pings can be ignored
          }
        };

        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;
          // Reconnect with 3-second backoff if still mounted
          if (isMounted) {
            reconnectTimeout = setTimeout(connectSSE, 3000);
          }
        };
      } catch {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectSSE, 5000);
        }
      }
    };

    connectSSE();

    return () => {
      isMounted = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [queryClient]);
}

