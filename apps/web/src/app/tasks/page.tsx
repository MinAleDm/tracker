"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Badge, Button } from "@tracker/ui";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskViewBar } from "@/features/task-view/ui/task-view-bar";
import { apiClient } from "@/lib/api-client";
import { BoardIcon, PlusIcon } from "@/shared/ui/tracker-icons";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { useUiStore } from "@/store/use-ui-store";
import { TasksTable } from "@/widgets/tasks-table/ui/tasks-table";
import { countByStatus, filterTasksByScope } from "@/widgets/workspace-shell/lib/task-utils";
import { getAttentionCounts } from "@/widgets/workspace-shell/lib/workspace-insights";
import { type TaskScope, WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

const scopes: Array<{ id: TaskScope; label: string }> = [
  { id: "all", label: "Все" },
  { id: "mine", label: "Мои" },
  { id: "unassigned", label: "Без исполнителя" },
  { id: "review", label: "Ревью" },
];

function ProjectStarter({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const templates = [
        {
          title: "Разобрать входящие задачи",
          description: "Соберите новые запросы, назначьте владельцев и переведите готовые элементы в работу.",
          priority: "HIGH",
        },
        {
          title: "Описать критерии готовности",
          description: "Добавьте ожидаемый результат, ограничения и ссылки, чтобы задачу можно было принять без уточнений.",
          priority: "MEDIUM",
        },
        {
          title: "Проверить задачу на ревью",
          description: "Пример review-очереди: задача ждёт решения или подтверждения результата.",
          status: "REVIEW",
          priority: "MEDIUM",
        },
        {
          title: "Закрыть первый результат",
          description: "Пример закрытой задачи для проверки аналитики и прогресса проекта.",
          status: "DONE",
          priority: "LOW",
        },
      ];

      await Promise.all(templates.map((task) => apiClient.createTask(projectId, task)));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return (
    <section className="tracker-panel rounded-xl p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-text">Проект пока пуст</p>
          <p className="mt-1 text-sm text-text/54">Создайте первую задачу или добавьте небольшой стартовый набор.</p>
        </div>
        <Button type="button" variant="primary" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          <PlusIcon className="mr-2" size={16} />
          {mutation.isPending ? "Создаю..." : "Добавить примеры"}
        </Button>
      </div>
    </section>
  );
}

export default function TasksPage() {
  const [scope, setScope] = useState<TaskScope>("all");
  const createTaskSignal = useUiStore((state) => state.createTaskSignal);

  return (
    <WorkspacePage title="Задачи" description="Единый список для triage, поиска и быстрого движения работы по статусам.">
      {(data) => {
        const scopedTasks = filterTasksByScope(data.tasks, scope, data.userId);
        const attention = getAttentionCounts(scopedTasks);

        return (
          <div className="space-y-4">
            <TaskViewBar userId={data.userId} />
            <BoardFilter users={data.members} />

            {data.selectedProjectId ? (
              <TaskCreate projectId={data.selectedProjectId} users={data.members} focusSignal={createTaskSignal} />
            ) : null}
            {data.selectedProjectId && data.tasks.length === 0 ? <ProjectStarter projectId={data.selectedProjectId} /> : null}

            <section className="tracker-panel overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 border-b border-border p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {scopes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setScope(item.id)}
                      className={clsx(
                        "rounded-lg px-3 py-2 text-sm font-medium transition",
                        scope === item.id ? "bg-[#25282e] text-white shadow-sm" : "text-text/56 hover:bg-muted hover:text-text",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  <span className="ml-1 text-xs tabular-nums text-text/40">{scopedTasks.length} задач</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {attention.unassigned > 0 ? <Badge tone="warning">{attention.unassigned} без исполнителя</Badge> : null}
                  {attention.stale > 0 ? <Badge tone="danger">{attention.stale} без движения</Badge> : null}
                  <Badge tone="success">{countByStatus(scopedTasks, "DONE")} закрыто</Badge>
                  <Link
                    href="/boards"
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-card px-3 text-sm font-semibold transition hover:bg-muted"
                  >
                    <BoardIcon className="mr-2" size={16} />
                    Доска
                  </Link>
                </div>
              </div>

              {data.isLoadingTasks ? (
                <div className="p-4">
                  <SkeletonBoard />
                </div>
              ) : (
                <TasksTable tasks={scopedTasks} users={data.members} />
              )}
            </section>
          </div>
        );
      }}
    </WorkspacePage>
  );
}
