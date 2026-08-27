import type { TaskDto, TaskStatus } from "@tracker/types";

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
