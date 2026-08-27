"use client";

import type { TaskStatus } from "@tracker/types";
import { Badge, Card } from "@tracker/ui";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/task-meta";
import {
  getAttentionCounts,
  getPriorityMix,
  getStatusBreakdown,
  getTeamWorkload,
  getTimeline,
} from "@/widgets/workspace-shell/lib/workspace-insights";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";

const statusBar: Record<TaskStatus, string> = {
  TODO: "bg-slate-400",
  IN_PROGRESS: "bg-sky-500",
  REVIEW: "bg-amber-500",
  DONE: "bg-emerald-500",
};

function Metric({ label, value, hint, tone = "neutral" }: { label: string; value: number; hint: string; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        {value > 0 && tone !== "neutral" ? <Badge tone={tone}>Требует внимания</Badge> : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </Card>
  );
}

export function AnalyticsContent({ data }: { data: WorkspaceData }) {
  const attention = getAttentionCounts(data.tasks);
  const statuses = getStatusBreakdown(data.tasks);
  const priorities = getPriorityMix(data.tasks.filter((task) => task.status !== "DONE"));
  const workload = getTeamWorkload(data.tasks, data.members);
  const timeline = getTimeline(data.tasks, 7);
  const maxStatus = Math.max(1, ...statuses.map((item) => item.count));
  const maxWorkload = Math.max(1, ...workload.map((item) => item.inFlight));
  const maxTimeline = Math.max(1, ...timeline.flatMap((item) => [item.created, item.touched]));
  const hasRecentActivity = timeline.some((item) => item.created > 0 || item.touched > 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric label="В работе" value={statuses.find((item) => item.status === "IN_PROGRESS")?.count ?? 0} hint="Активные незакрытые задачи" />
        <Metric label="На ревью" value={attention.review} hint="Ждут проверки или решения" tone="warning" />
        <Metric label="Без исполнителя" value={attention.unassigned} hint="Только незакрытые задачи" tone="warning" />
        <Metric label="Без движения" value={attention.stale} hint="Не обновлялись более 7 дней" tone="danger" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Состояние потока</h2>
          <p className="mt-1 text-sm text-muted-foreground">Количество задач на каждом этапе</p>
          <div className="mt-5 space-y-4">
            {statuses.map((item) => (
              <div key={item.status}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <Badge tone={statusTone[item.status]}>{statusLabels[item.status]}</Badge>
                  <span className="font-semibold tabular-nums">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${statusBar[item.status]}`} style={{ width: `${(item.count / maxStatus) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Активные задачи по исполнителям</h2>
          <p className="mt-1 text-sm text-muted-foreground">Это объём назначенной работы, не оценка загрузки или производительности</p>
          <div className="mt-5 space-y-4">
            {workload.length ? workload.map((item) => (
              <div key={item.member.id}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{item.member.name}</span>
                  <span className="shrink-0 text-muted-foreground"><strong className="text-foreground">{item.inFlight}</strong> активных · {item.done} закрыто</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(item.inFlight / maxWorkload) * 100}%` }} />
                </div>
              </div>
            )) : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">В проекте пока нет участников.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <Card className="p-5">
          <h2 className="font-semibold">Активность за 7 дней</h2>
          <p className="mt-1 text-sm text-muted-foreground">Созданные и обновлённые задачи по календарным дням</p>
          {hasRecentActivity ? (
            <div className="mt-6 flex h-44 items-end gap-2" aria-label="График активности за семь дней">
              {timeline.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end justify-center gap-1">
                    <div className="w-2/5 rounded-t bg-primary" style={{ height: `${Math.max(item.created ? 8 : 0, (item.created / maxTimeline) * 100)}%` }} title={`Создано: ${item.created}`} />
                    <div className="w-2/5 rounded-t bg-sky-400" style={{ height: `${Math.max(item.touched ? 8 : 0, (item.touched / maxTimeline) * 100)}%` }} title={`Обновлено: ${item.touched}`} />
                  </div>
                  <span className="truncate text-[10px] text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed px-5 py-10 text-center">
              <p className="text-sm font-medium">За последние 7 дней изменений нет</p>
              <p className="mt-1 text-xs text-muted-foreground">График появится после создания или обновления задачи.</p>
            </div>
          )}
          <div className="mt-4 flex gap-4 text-xs text-muted-foreground"><span><i className="mr-1.5 inline-block size-2 rounded-full bg-primary" />Создано</span><span><i className="mr-1.5 inline-block size-2 rounded-full bg-sky-400" />Обновлено</span></div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Приоритет активных задач</h2>
          <p className="mt-1 text-sm text-muted-foreground">Закрытые задачи не учитываются</p>
          <div className="mt-5 space-y-3">
            {priorities.map((item) => (
              <div key={item.priority} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
                <Badge tone={priorityTone[item.priority]}>{priorityLabels[item.priority]}</Badge>
                <span className="font-semibold tabular-nums">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
