"use client";

import { Badge } from "@tracker/ui";
import { statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { countByStatus, getCompletion } from "@/widgets/workspace-shell/lib/task-utils";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";

export function AnalyticsContent({ data }: { data: WorkspaceData }) {
  const completion = getCompletion(data.tasks);
  const maxCount = Math.max(...statusOrder.map((status) => countByStatus(data.tasks, status)), 1);
  const assigneeGroups = data.members.map((member) => ({
    member,
    count: data.tasks.filter((task) => task.assignee?.id === member.id).length,
  }));

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section>
        <p className="text-xs uppercase tracking-[0.18em] text-text/40">Workflow health</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Распределение по статусам</h2>
        <div className="mt-6 space-y-5 border-y border-black/[0.08] py-5">
          {statusOrder.map((status) => {
            const count = countByStatus(data.tasks, status);

            return (
              <div key={status}>
                <div className="flex items-center justify-between gap-4">
                  <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                  <span className="text-sm font-semibold text-text">{count}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full bg-[#111827]" style={{ width: `${Math.max((count / maxCount) * 100, count ? 8 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <aside className="space-y-8">
        <div className="border-y border-black/[0.08] py-5">
          <p className="text-xs uppercase tracking-[0.18em] text-text/40">Готовность</p>
          <p className="mt-2 text-5xl font-semibold tracking-[-0.06em] text-text">{completion}%</p>
        </div>
        <section>
          <p className="text-lg font-semibold text-text">Нагрузка команды</p>
          <div className="mt-4 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {assigneeGroups.length === 0 ? (
              <p className="py-4 text-sm leading-6 text-text/52">Добавьте участников в организацию, чтобы видеть распределение задач.</p>
            ) : (
              assigneeGroups.map(({ member, count }) => (
                <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-text">{member.name}</span>
                  <span className="text-sm font-bold text-text">{count}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
