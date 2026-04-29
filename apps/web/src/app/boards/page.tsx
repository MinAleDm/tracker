"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { KanbanBoard } from "@/widgets/kanban-board/ui/kanban-board";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

export default function BoardsPage() {
  const router = useRouter();

  return (
    <WorkspacePage
      title="Доски"
      description="Отдельная канбан-доска для управления workflow: перетаскивайте карточки и открывайте задачу на отдельной странице."
    >
      {(data) => (
        <div className="space-y-5">
          <BoardFilter users={data.members} />
          {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} /> : null}
          <KanbanBoard tasks={data.tasks} onOpenTask={(taskId) => router.push(`/tasks/${taskId}` as Route)} />
        </div>
      )}
    </WorkspacePage>
  );
}
