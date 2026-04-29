"use client";

import Link from "next/link";
import type { Route } from "next";
import { Badge, Button } from "@tracker/ui";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/task-meta";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { PlusIcon } from "@/shared/ui/tracker-icons";
import { countByStatus, getCompletion, sortByFreshness, taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border-l border-black/[0.08] pl-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text/40">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-text">{value}</p>
    </div>
  );
}

export function OverviewContent({ data, onCreateTask }: { data: WorkspaceData; onCreateTask: () => void }) {
  const freshTasks = sortByFreshness(data.tasks).slice(0, 5);
  const urgentTasks = data.tasks.filter((task) => task.priority === "URGENT" || task.status === "REVIEW").slice(0, 4);

  return (
    <div className="space-y-10">
      <section className="grid gap-5 border-y border-black/[0.08] py-6 md:grid-cols-4">
        <Metric label="Всего" value={data.tasks.length} />
        <Metric label="В работе" value={countByStatus(data.tasks, "IN_PROGRESS")} />
        <Metric label="Ревью" value={countByStatus(data.tasks, "REVIEW")} />
        <Metric label="Готово" value={`${getCompletion(data.tasks)}%`} />
      </section>

      <section className="grid gap-10 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-text/40">Командный фокус</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Что требует внимания</h2>
            </div>
            <Button type="button" variant="primary" className="rounded-xl bg-[#111827] px-4 py-2.5 hover:bg-[#020617]" onClick={onCreateTask}>
              <PlusIcon className="mr-2" size={16} />
              Новая задача
            </Button>
          </div>

          <div className="mt-5 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {urgentTasks.length === 0 ? (
              <EmptyState title="Критичных задач нет" description="Ревью и срочные задачи будут появляться в этом блоке автоматически." />
            ) : (
              urgentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}` as Route}
                  className="grid gap-3 py-4 transition hover:bg-black/[0.025] md:grid-cols-[110px_minmax(0,1fr)_150px]"
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text/40">{taskKey(task)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text">{task.title}</span>
                    <span className="mt-1 block text-sm text-text/50">{task.assignee?.name ?? "Без исполнителя"}</span>
                  </span>
                  <span className="flex items-center gap-2 md:justify-end">
                    <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                    <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        <aside>
          <p className="text-xs uppercase tracking-[0.18em] text-text/40">Последние обновления</p>
          <div className="mt-5 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {freshTasks.length === 0 ? (
              <p className="py-5 text-sm leading-6 text-text/58">Пока нет задач для отображения.</p>
            ) : (
              freshTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-4 transition hover:bg-black/[0.025]">
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <p className="mt-1 text-xs text-text/44">Обновлено {formatRelativeDate(task.updatedAt)}</p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
