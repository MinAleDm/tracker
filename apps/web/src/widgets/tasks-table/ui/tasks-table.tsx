"use client";

import Link from "next/link";
import type { Route } from "next";
import type { TaskDto } from "@tracker/types";
import { Badge } from "@tracker/ui";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/task-meta";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { getInitials } from "@/shared/lib/utils/string";
import { CommentIcon } from "@/shared/ui/tracker-icons";
import { taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { isTaskStale } from "@/widgets/workspace-shell/lib/workspace-insights";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";

const rowGrid = "md:grid-cols-[88px_minmax(260px,1fr)_120px_140px_170px_110px]";

export function TasksTable({ tasks }: { tasks: TaskDto[] }) {
  if (tasks.length === 0) {
    return <EmptyState title="Задач не найдено" description="Сбросьте фильтры или выберите другое представление." />;
  }

  return (
    <div className="bg-card">
      <div className="hidden border-b bg-muted/40 px-4 py-2.5 md:block">
        <div className={`grid gap-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground ${rowGrid}`}>
          <span>Ключ</span><span>Задача</span><span>Приоритет</span><span>Статус</span><span>Исполнитель</span><span>Обновлено</span>
        </div>
      </div>

      <div className="divide-y">
        {tasks.map((task) => {
          const stale = isTaskStale(task);
          return (
            <Link
              key={task.id}
              href={`/tasks/${task.id}` as Route}
              className={`group block gap-3 px-4 py-3 transition-colors hover:bg-muted/40 md:grid md:items-center ${rowGrid}`}
            >
              <span className="font-mono text-[11px] font-semibold uppercase text-muted-foreground">{taskKey(task)}</span>

              <span className="mt-1 block min-w-0 md:mt-0">
                <span className="block truncate text-sm font-medium group-hover:text-primary">{task.title}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{task.description || "Без описания"}</span>
                <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground md:hidden">
                  <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                  <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
                </span>
              </span>

              <span className="hidden md:block"><Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge></span>
              <span className="hidden md:block"><Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge></span>

              <span className="mt-3 flex min-w-0 items-center gap-2 md:mt-0">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">{getInitials(task.assignee?.name ?? "—")}</span>
                <span className="truncate text-xs text-muted-foreground">{task.assignee?.name ?? "Не назначен"}</span>
              </span>

              <span className="mt-2 flex items-center gap-3 text-xs text-muted-foreground md:mt-0 md:block">
                <span>{formatRelativeDate(task.updatedAt)}</span>
                <span className="inline-flex items-center gap-1 md:mt-1 md:flex"><CommentIcon size={12} />{task.commentsCount}</span>
                {stale ? <span className="text-destructive md:mt-1 md:block">Без движения</span> : null}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
