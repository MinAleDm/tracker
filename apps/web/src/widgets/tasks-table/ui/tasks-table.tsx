"use client";

import Link from "next/link";
import type { Route } from "next";
import type { TaskDto } from "@tracker/types";
import { Badge } from "@tracker/ui";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/task-meta";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { UserIcon } from "@/shared/ui/tracker-icons";
import { taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";

export function TasksTable({ tasks }: { tasks: TaskDto[] }) {
  if (tasks.length === 0) {
    return <EmptyState title="Задач не найдено" description="Попробуйте сбросить фильтры или создайте новую задачу в выбранном проекте." />;
  }

  return (
    <section className="border-y border-black/[0.08]">
      <div className="hidden grid-cols-[110px_minmax(0,1.5fr)_150px_150px_170px_120px] gap-4 border-b border-black/[0.08] py-3 text-xs font-bold uppercase tracking-[0.16em] text-text/38 xl:grid">
        <span>ID</span>
        <span>Название</span>
        <span>Статус</span>
        <span>Приоритет</span>
        <span>Исполнитель</span>
        <span>Обновлено</span>
      </div>
      <div className="divide-y divide-black/[0.08]">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}` as Route}
            className="grid gap-3 py-4 transition hover:bg-black/[0.025] xl:grid-cols-[110px_minmax(0,1.5fr)_150px_150px_170px_120px] xl:items-center"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text/40">{taskKey(task)}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-text">{task.title}</span>
              <span className="mt-1 block truncate text-sm text-text/48">{task.description || "Описание не заполнено"}</span>
            </span>
            <span>
              <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
            </span>
            <span>
              <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
            </span>
            <span className="flex items-center gap-2 text-sm text-text/58">
              <UserIcon size={16} />
              {task.assignee?.name ?? "Не назначен"}
            </span>
            <span className="text-sm text-text/46">{formatRelativeDate(task.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
