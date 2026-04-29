import type { TaskPriority, TaskStatus } from "@tracker/types";

export const statusOrder: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export const statusLabels: Record<TaskStatus, string> = {
  TODO: "Открыт",
  IN_PROGRESS: "В работе",
  REVIEW: "Ревью",
  DONE: "Закрыт",
};

export const priorityLabels: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
  URGENT: "Критичный",
};

export const priorityTone: Record<TaskPriority, "neutral" | "success" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "success",
  HIGH: "warning",
  URGENT: "danger",
};

export const statusTone: Record<TaskStatus, "neutral" | "success" | "warning" | "danger"> = {
  TODO: "neutral",
  IN_PROGRESS: "warning",
  REVIEW: "warning",
  DONE: "success",
};

export const statusAccentClass: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-600",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

export function taskInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
