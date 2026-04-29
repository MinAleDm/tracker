"use client";

import { useState } from "react";
import clsx from "clsx";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { filterTasksByScope, type TaskScope, TasksTable, WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

const scopes: Array<{ id: TaskScope; label: string }> = [
  { id: "all", label: "Все" },
  { id: "mine", label: "Мои" },
  { id: "unassigned", label: "Без исполнителя" },
  { id: "review", label: "Ревью" },
];

export default function TasksPage() {
  const [scope, setScope] = useState<TaskScope>("all");

  return (
    <WorkspacePage
      title="Задачи"
      description="Отдельный список задач для triage, поиска и перехода в полноценную карточку задачи."
    >
      {(data) => {
        const scopedTasks = filterTasksByScope(data.tasks, scope, data.userId);

        return (
          <div className="space-y-5">
            <BoardFilter users={data.members} />
            {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} /> : null}
            <div className="flex flex-wrap gap-2 rounded-[28px] border border-white/70 bg-white/60 p-2 backdrop-blur">
              {scopes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id)}
                  className={clsx(
                    "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
                    scope === item.id ? "bg-[#111827] text-white shadow-sm" : "text-text/56 hover:bg-white hover:text-text",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <TasksTable tasks={scopedTasks} />
          </div>
        );
      }}
    </WorkspacePage>
  );
}
