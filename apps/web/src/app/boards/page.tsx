"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { Badge } from "@tracker/ui";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskViewBar } from "@/features/task-view/ui/task-view-bar";
import { statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { KanbanBoard } from "@/widgets/kanban-board/ui/kanban-board";
import { countByStatus } from "@/widgets/workspace-shell/lib/task-utils";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

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

          <KanbanBoard tasks={data.tasks} onOpenTask={(taskId) => router.push(`/tasks/${taskId}` as Route)} />
        </div>
      )}
    </WorkspacePage>
  );
}
