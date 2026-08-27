"use client";

import type { Route } from "next";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskViewBar } from "@/features/task-view/ui/task-view-bar";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

const KanbanBoard = dynamic(
  () => import("@/widgets/kanban-board/ui/kanban-board").then((module) => module.KanbanBoard),
  { ssr: false, loading: () => <SkeletonBoard /> },
);

export default function BoardsPage() {
  const router = useRouter();
  return (
    <WorkspacePage title="Доска" description="Поток задач по статусам. Перетащите карточку, чтобы изменить этап работы.">
      {(data) => (
        <div className="space-y-4">
          <section className="tracker-panel overflow-hidden rounded-xl">
            <div className="flex flex-col gap-3 p-3 xl:flex-row xl:items-center">
              <TaskViewBar userId={data.userId} />
              <div className="shrink-0 xl:ml-auto">
                {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} /> : null}
              </div>
            </div>
            <div className="border-t p-3"><BoardFilter users={data.members} /></div>
          </section>

          {data.isLoadingTasks ? <SkeletonBoard /> : <KanbanBoard tasks={data.tasks} onOpenTask={(taskId) => router.push(`/tasks/${taskId}` as Route)} />}
        </div>
      )}
    </WorkspacePage>
  );
}
