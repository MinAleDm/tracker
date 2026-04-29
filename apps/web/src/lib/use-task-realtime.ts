"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { queryKeys } from "@/lib/query-keys";
import { useUiStore } from "@/store/use-ui-store";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001";

export function useTaskRealtime(projectId: string | null) {
  const queryClient = useQueryClient();
  const accessToken = useUiStore((state) => state.accessToken);

  useEffect(() => {
    if (!projectId || !accessToken) {
      return;
    }

    const socket = io(`${SOCKET_URL}/tasks`, {
      auth: {
        token: accessToken,
      },
    });

    // Подписка держится на выбранном проекте, чтобы не инвалидировать лишние доски.
    socket.emit("project:subscribe", projectId);
    socket.on("task:changed", (event: { projectId: string; taskId: string }) => {
      void queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.task(event.taskId) });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, projectId, queryClient]);
}
