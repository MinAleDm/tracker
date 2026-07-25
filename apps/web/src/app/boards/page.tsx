"use client";

import type { Route } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Badge } from "@tracker/ui";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskViewBar } from "@/features/task-view/ui/task-view-bar";
import { statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { countByStatus } from "@/widgets/workspace-shell/lib/task-utils";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

const KanbanBoard = dynamic(
  () => import("@/widgets/kanban-board/ui/kanban-board").then((module) => module.KanbanBoard),
  {
    ssr: false,
    loading: () => <SkeletonBoard />,
  },
);

export default function BoardsPage() {
  const router = useRouter();

  return (
    <WorkspacePage title="Доска" description="Визуальный поток задач от входящей очереди до готового результата.">
      {(data) => (
        <div className="space-y-4">
          <TaskViewBar userId={data.userId} />
          <BoardFilter users={data.members} />
          {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} /> : null}

          <section className="tracker-panel flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-4 py-3">
            <p className="mr-auto text-sm font-semibold text-text">Поток проекта</p>
            {statusOrder.map((status) => (
              <span key={status} className="inline-flex items-center gap-2 text-xs text-text/48">
                <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                <span className="font-semibold tabular-nums text-text">{countByStatus(data.tasks, status)}</span>
              </span>
            ))}
          </section>

          {data.isLoadingTasks ? (
            <SkeletonBoard />
          ) : (
            <KanbanBoard tasks={data.tasks} onOpenTask={(taskId) => router.push(`/tasks/${taskId}` as Route)} />
          )}
        </div>
      )}
    </WorkspacePage>
  );
}
