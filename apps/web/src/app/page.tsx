"use client";

import { useState } from "react";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { OverviewContent } from "@/widgets/overview/ui/overview-content";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

export default function Page() {
  const [focusSignal, setFocusSignal] = useState(0);

  return (
    <WorkspacePage
      title="Главная"
      description="Оперативная сводка по проекту: приоритеты, последние изменения и быстрый вход в работу."
    >
      {(data) => (
        <div className="space-y-5">
          {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} focusSignal={focusSignal} /> : null}
          <OverviewContent data={data} onCreateTask={() => setFocusSignal((value) => value + 1)} />
        </div>
      )}
    </WorkspacePage>
  );
}
