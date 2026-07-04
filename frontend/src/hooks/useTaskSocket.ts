import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokenStorage } from "../auth/tokenStorage";
import type { PaginatedTasks, WsEvent } from "../types";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8000";

/**
 * Opens a WebSocket connection for real-time task events and keeps the
 * React Query cache for `["tasks", ...]` queries in sync as events arrive.
 *
 * We don't try to patch every possible paginated/filtered query variant in
 * place (e.g. re-sorting a page when a task's status changes could shift it
 * onto a different page). Instead we do a targeted `setQueryData` for the
 * common case (task appears in the currently-cached page) and fall back to
 * `invalidateQueries` so React Query refetches anything we didn't patch.
 * This keeps the logic simple and correct rather than fully optimistic.
 */
export function useTaskSocket(enabled: boolean) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = tokenStorage.getAccessToken();
    if (!token) return;

    const socket = new WebSocket(`${WS_BASE_URL}/ws/tasks?token=${encodeURIComponent(token)}`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const parsed: WsEvent = JSON.parse(event.data);
        handleEvent(parsed);
      } catch {
        // Ignore malformed messages rather than crashing the socket handler.
      }
    };

    function handleEvent(wsEvent: WsEvent) {
      queryClient.setQueriesData<PaginatedTasks>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;

        if (wsEvent.event === "task_deleted") {
          return { ...old, items: old.items.filter((t) => t.id !== wsEvent.data.id) };
        }

        const exists = old.items.some((t) => t.id === wsEvent.data.id);
        if (wsEvent.event === "task_created" && !exists) {
          return old;
        }
        if (exists) {
          return {
            ...old,
            items: old.items.map((t) => (t.id === wsEvent.data.id ? wsEvent.data : t)),
          };
        }
        return old;
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    }

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);
}
