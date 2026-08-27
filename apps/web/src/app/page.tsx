"use client";

import { TaskCreate } from "@/features/task-create/ui/task-create";
import { OverviewContent } from "@/widgets/overview/ui/overview-content";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

export default function Page() {
  return (
    <WorkspacePage
      title="Главная"
      description="Оперативная сводка по проекту: приоритеты, последние изменения и быстрый вход в работу."
    >
      {(data) => (
        <div className="space-y-5">
          {data.selectedProjectId ? <TaskCreate projectId={data.selectedProjectId} users={data.members} showTrigger={false} /> : null}
          <OverviewContent data={data} />
        </div>
      )}
    </WorkspacePage>
  );
}
