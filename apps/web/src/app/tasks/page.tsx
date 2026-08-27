"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge, Button } from "@tracker/ui";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskViewBar } from "@/features/task-view/ui/task-view-bar";
import { apiClient } from "@/lib/api-client";
import { BoardIcon, PlusIcon } from "@/shared/ui/tracker-icons";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { TasksTable } from "@/widgets/tasks-table/ui/tasks-table";
import { getAttentionCounts } from "@/widgets/workspace-shell/lib/workspace-insights";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

function ProjectStarter({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async () => {
      const templates = [
        { title: "Разобрать входящие задачи", description: "Назначьте владельцев и уточните следующий шаг.", priority: "HIGH" },
        { title: "Описать критерии готовности", description: "Зафиксируйте ожидаемый результат и ограничения.", priority: "MEDIUM" },
        { title: "Проверить результат", description: "Задача ждёт решения или подтверждения.", status: "REVIEW", priority: "MEDIUM" },
      ];
      await Promise.all(templates.map((task) => apiClient.createTask(projectId, task)));
    },
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }),
  });

  return (
    <section className="rounded-xl border border-dashed bg-card p-6 text-center">
      <h2 className="font-semibold">Проект пока пуст</h2>
      <p className="mt-1 text-sm text-muted-foreground">Создайте первую задачу или добавьте три примера рабочего потока.</p>
      <Button type="button" variant="outline" className="mt-4" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
        <PlusIcon className="mr-2" size={16} />
        {mutation.isPending ? "Добавляю…" : "Добавить примеры"}
      </Button>
    </section>
  );
}

export default function TasksPage() {
  return (
    <WorkspacePage title="Задачи" description="Список работы проекта с персональными представлениями и быстрыми фильтрами.">
      {(data) => {
        const attention = getAttentionCounts(data.tasks);
        return (
          <div className="space-y-4">
            <section className="tracker-panel overflow-hidden rounded-xl">
              <div className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center">
                <TaskViewBar userId={data.userId} />
                <div className="flex shrink-0 gap-2 xl:ml-auto">
                  <Button asChild variant="outline"><Link href="/boards"><BoardIcon className="mr-2" size={16} />Доска</Link></Button>
                  {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} /> : null}
                </div>
              </div>
              <div className="border-t p-3"><BoardFilter users={data.members} /></div>
            </section>

            {data.selectedProjectId && data.tasks.length === 0 ? <ProjectStarter projectId={data.selectedProjectId} /> : null}

            <section className="tracker-panel overflow-hidden rounded-xl">
              <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <h2 className="mr-auto text-sm font-semibold">{data.tasks.length} задач</h2>
                {attention.unassigned > 0 ? <Badge tone="warning">{attention.unassigned} без исполнителя</Badge> : null}
                {attention.stale > 0 ? <Badge tone="danger">{attention.stale} без движения</Badge> : null}
              </header>
              {data.isLoadingTasks ? <div className="p-4"><SkeletonBoard /></div> : <TasksTable tasks={data.tasks} />}
            </section>
          </div>
        );
      }}
    </WorkspacePage>
  );
}
