import type { TaskDto, TaskStatus } from "@tracker/types";
import type { TaskScope } from "@/widgets/workspace-shell/model/types";

export function taskKey(task: TaskDto): string {
  return task.id.slice(-8).toUpperCase();
}

export function countByStatus(tasks: TaskDto[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

export function getCompletion(tasks: TaskDto[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  return Math.round((countByStatus(tasks, "DONE") / tasks.length) * 100);
}

export function sortByFreshness(tasks: TaskDto[]): TaskDto[] {
  return [...tasks].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function filterTasksByScope(tasks: TaskDto[], scope: TaskScope, userId?: string): TaskDto[] {
  // Локальный scope накладывается поверх серверных фильтров, чтобы переключение было мгновенным.
  if (scope === "mine") {
    return tasks.filter((task) => task.assignee?.id === userId || task.creator.id === userId);
  }

  if (scope === "unassigned") {
    return tasks.filter((task) => !task.assignee);
  }

  if (scope === "review") {
    return tasks.filter((task) => task.status === "REVIEW");
  }

  return tasks;
}
