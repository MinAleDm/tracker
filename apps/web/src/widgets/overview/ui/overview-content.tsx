"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import type { TaskDto, TaskPriority } from "@tracker/types";
import { Badge, Button, Card } from "@tracker/ui";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/task-meta";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { PlusIcon } from "@/shared/ui/tracker-icons";
import { useUiStore } from "@/store/use-ui-store";
import { taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { getAttentionCounts, getRecentUpdates } from "@/widgets/workspace-shell/lib/workspace-insights";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";

const priorityRank: Record<TaskPriority, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function sortForFocus(tasks: TaskDto[]) {
  return [...tasks].sort((left, right) => priorityRank[left.priority] - priorityRank[right.priority] || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function TaskRow({ task }: { task: TaskDto }) {
  return (
    <Link href={`/tasks/${task.id}` as Route} className="grid gap-2 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40 sm:grid-cols-[90px_minmax(0,1fr)_auto] sm:items-center">
      <span className="font-mono text-[11px] font-semibold uppercase text-muted-foreground">{taskKey(task)}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{task.title}</span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{task.assignee?.name ?? "Без исполнителя"} · {formatRelativeDate(task.updatedAt)}</span>
      </span>
      <span className="flex gap-2 sm:justify-end">
        <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
        <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
      </span>
    </Link>
  );
}

export function OverviewContent({ data }: { data: WorkspaceData }) {
  const router = useRouter();
  const requestTaskCreate = useUiStore((state) => state.requestTaskCreate);
  const applyTaskView = useUiStore((state) => state.applyTaskView);
  const attention = getAttentionCounts(data.tasks);
  const myTasks = sortForFocus(data.tasks.filter((task) => task.assignee?.id === data.userId && task.status !== "DONE")).slice(0, 6);
  const recentTasks = getRecentUpdates(data.tasks, 4);

  const openView = (filters: { status: "ALL" | "REVIEW" | "TODO"; assigneeId: string }) => {
    applyTaskView({ search: "", priority: "ALL", ...filters });
    router.push("/tasks");
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Рабочий фокус</p>
          <h2 className="mt-1 text-xl font-semibold">Что делать дальше</h2>
        </div>
        <Button onClick={requestTaskCreate}><PlusIcon className="mr-2" size={16} />Новая задача</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <Card className="self-start overflow-hidden">
          <header className="flex items-center justify-between border-b px-4 py-3">
            <div><h3 className="font-semibold">Моя работа</h3><p className="mt-0.5 text-xs text-muted-foreground">Активные задачи, отсортированные по приоритету</p></div>
            <Button variant="ghost" size="sm" onClick={() => openView({ status: "ALL", assigneeId: data.userId })}>Все мои</Button>
          </header>
          {myTasks.length ? myTasks.map((task) => <TaskRow key={task.id} task={task} />) : (
            <div className="px-5 py-12 text-center">
              <p className="font-medium">Активных задач нет</p>
              <p className="mt-1 text-sm text-muted-foreground">Возьмите задачу из входящей очереди или создайте новую.</p>
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-4">
            <h3 className="font-semibold">Очереди</h3>
            <p className="mt-1 text-xs text-muted-foreground">Работа, которая требует решения команды</p>
            <div className="mt-4 space-y-2">
              <button type="button" onClick={() => openView({ status: "TODO", assigneeId: "unassigned" })} className="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50"><span><span className="block text-sm font-medium">Нужен разбор</span><span className="text-xs text-muted-foreground">Открыты и не назначены</span></span><Badge tone={attention.unassigned ? "warning" : "neutral"}>{attention.unassigned}</Badge></button>
              <button type="button" onClick={() => openView({ status: "REVIEW", assigneeId: "ALL" })} className="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50"><span><span className="block text-sm font-medium">На ревью</span><span className="text-xs text-muted-foreground">Ждут проверки или решения</span></span><Badge tone={attention.review ? "warning" : "neutral"}>{attention.review}</Badge></button>
              <button type="button" onClick={() => openView({ status: "ALL", assigneeId: data.userId })} className="flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors hover:bg-muted/50"><span><span className="block text-sm font-medium">Моя очередь</span><span className="text-xs text-muted-foreground">Назначено мне</span></span><Badge>{myTasks.length}</Badge></button>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <header className="border-b px-4 py-3"><h3 className="font-semibold">Последние изменения</h3></header>
            {recentTasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block border-b px-4 py-3 last:border-b-0 hover:bg-muted/40"><p className="truncate text-sm font-medium">{task.title}</p><p className="mt-1 text-xs text-muted-foreground">{formatRelativeDate(task.updatedAt)}</p></Link>)}
          </Card>
        </div>
      </div>
    </div>
  );
}
