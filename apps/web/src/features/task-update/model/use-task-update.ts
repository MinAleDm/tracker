"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskPriority, TaskStatus } from "@tracker/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export type TaskUpdateInput = Partial<{
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
}>;

export function useTaskUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TaskUpdateInput }) =>
      apiClient.updateTask(taskId, input),
    onSuccess: async (task) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.task(task.id) }),
      ]);
    },
  });
}
