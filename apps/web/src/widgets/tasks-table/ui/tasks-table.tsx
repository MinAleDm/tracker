"use client";

import Link from "next/link";
import type { Route } from "next";
import type { TaskDto, TaskPriority, TaskStatus, UserSummaryDto } from "@tracker/types";
import { Badge, Select } from "@tracker/ui";
import { type TaskUpdateInput, useTaskUpdate } from "@/features/task-update/model/use-task-update";
import { priorityLabels, statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { CommentIcon } from "@/shared/ui/tracker-icons";
import { taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { isTaskStale } from "@/widgets/workspace-shell/lib/workspace-insights";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";

const rowGrid = "xl:grid-cols-[96px_minmax(280px,1fr)_128px_180px_170px_116px]";

function FieldLabel({ children }: { children: string }) {
  return <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-text/36 xl:hidden">{children}</span>;
}

export function TasksTable({ tasks, users }: { tasks: TaskDto[]; users: UserSummaryDto[] }) {
  const updateMutation = useTaskUpdate();

  const updateTask = (task: TaskDto, input: TaskUpdateInput) => {
    updateMutation.mutate({ taskId: task.id, input });
  };

  if (tasks.length === 0) {
    return <EmptyState title="Задач не найдено" description="Сбросьте фильтры, смените представление или создайте новую задачу." />;
  }

  return (
    <div className="overflow-hidden bg-card">
      <div className="hidden border-b border-border bg-muted/55 px-4 py-2.5 xl:block">
        <div className={`grid gap-3 text-[11px] font-semibold uppercase tracking-wide text-text/36 ${rowGrid}`}>
          <span>Ключ</span>
          <span>Задача</span>
          <span>Приоритет</span>
          <span>Исполнитель</span>
          <span>Статус</span>
          <span>Обновлено</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {tasks.map((task) => {
          const stale = isTaskStale(task);

          return (
            <article
              key={task.id}
              className={`grid gap-3 px-4 py-3 transition hover:bg-muted/45 xl:items-center ${rowGrid}`}
            >
              <div>
                <FieldLabel>Ключ</FieldLabel>
                <Link href={`/tasks/${task.id}` as Route} className="font-mono text-xs font-bold uppercase text-text/44 hover:text-accent">
                  {taskKey(task)}
                </Link>
              </div>

              <div className="min-w-0">
                <FieldLabel>Задача</FieldLabel>
                <Link href={`/tasks/${task.id}` as Route} className="block truncate text-sm font-semibold text-text hover:text-accent">
                  {task.title}
                </Link>
                <p className="mt-1 line-clamp-1 text-xs leading-5 text-text/46">{task.description || "Описание не заполнено"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text/40">
                  <span className="inline-flex items-center gap-1">
                    <CommentIcon size={13} />
                    {task.commentsCount}
                  </span>
                  {stale ? <Badge tone="danger">Без движения</Badge> : null}
                  {!task.assignee ? <Badge tone="warning">Нужен owner</Badge> : null}
                </div>
              </div>

              <div>
                <FieldLabel>Приоритет</FieldLabel>
                <Select
                  aria-label={`Приоритет задачи ${task.title}`}
                  value={task.priority}
                  disabled={updateMutation.isPending}
                  onChange={(event) => updateTask(task, { priority: event.target.value as TaskPriority })}
                  className="py-1.5 text-xs"
                >
                  {Object.entries(priorityLabels).map(([priority, label]) => (
                    <option key={priority} value={priority}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Исполнитель</FieldLabel>
                <Select
                  aria-label={`Исполнитель задачи ${task.title}`}
                  value={task.assignee?.id ?? ""}
                  disabled={updateMutation.isPending}
                  onChange={(event) => updateTask(task, { assigneeId: event.target.value || null })}
                  className="py-1.5 text-xs"
                >
                  <option value="">Не назначен</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel>Статус</FieldLabel>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                  <Select
                    aria-label={`Статус задачи ${task.title}`}
                    value={task.status}
                    disabled={updateMutation.isPending}
                    onChange={(event) => updateTask(task, { status: event.target.value as TaskStatus })}
                    className="min-w-0 py-1.5 text-xs"
                  >
                    {statusOrder.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <FieldLabel>Обновлено</FieldLabel>
                <p className="text-xs text-text/46">{formatRelativeDate(task.updatedAt)}</p>
                <Link href={`/tasks/${task.id}` as Route} className="mt-1 inline-flex text-xs font-semibold text-accent hover:underline">
                  Открыть →
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
