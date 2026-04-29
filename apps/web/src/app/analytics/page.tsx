"use client";

import { AnalyticsContent } from "@/widgets/analytics/ui/analytics-content";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

export default function AnalyticsPage() {
  return (
    <WorkspacePage
      title="Аналитика"
      description="Отдельный экран метрик: статус workflow, готовность проекта и распределение нагрузки по команде."
    >
      {(data) => <AnalyticsContent data={data} />}
    </WorkspacePage>
  );
}
