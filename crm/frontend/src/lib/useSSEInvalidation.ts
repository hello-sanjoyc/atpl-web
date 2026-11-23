import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "../api/interceptors";

const base = import.meta.env.VITE_API_BASE_URL ?? "";
const prefix = import.meta.env.VITE_API_PREFIX ?? "/api/v1";

interface InvalidationEvent {
    type: string;
    queryKeys: string[][];
}

/**
 * Opens a persistent SSE connection to /events and invalidates React Query cache keys
 * whenever the server publishes an invalidation message (e.g. after a role or permission write).
 *
 * Reconnects automatically with exponential back-off. No-ops when no token is present.
 */
export function useSSEInvalidation() {
    const queryClient = useQueryClient();
    const esRef = useRef<EventSource | null>(null);
    const retryRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        let cancelled = false;

        function connect() {
            const token = getToken();
            if (!token || cancelled) return;

            const url = `${base}${prefix}/events?token=${encodeURIComponent(token)}`;
            const es = new EventSource(url);
            esRef.current = es;

            es.onopen = () => {
                retryRef.current = 0;
            };

            es.onmessage = (e: MessageEvent<string>) => {
                try {
                    const event = JSON.parse(e.data) as InvalidationEvent;
                    if (Array.isArray(event.queryKeys)) {
                        for (const qk of event.queryKeys) {
                            void queryClient.invalidateQueries({
                                queryKey: qk,
                            });
                        }
                    }
                } catch {
                    // malformed message — ignore
                }
            };

            es.onerror = () => {
                es.close();
                esRef.current = null;
                if (!cancelled) {
                    // Exponential back-off: 1s, 2s, 4s … capped at 30s
                    const delay = Math.min(
                        1000 * 2 ** retryRef.current,
                        30_000,
                    );
                    retryRef.current += 1;
                    timerRef.current = setTimeout(connect, delay);
                }
            };
        }

        connect();

        return () => {
            cancelled = true;
            if (timerRef.current) clearTimeout(timerRef.current);
            esRef.current?.close();
            esRef.current = null;
        };
    }, [queryClient]);
}
