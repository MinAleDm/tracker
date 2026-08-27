"use client";

import { AnalyticsContent } from "@/widgets/analytics/ui/analytics-content";
import { WorkspacePage } from "@/widgets/workspace-shell/ui/workspace-shell";

export default function AnalyticsPage() {
  return (
    <WorkspacePage
      title="Аналитика"
      description="Измеримые показатели потока задач без условных рейтингов и прогнозов."
    >
      {(data) => <AnalyticsContent data={data} />}
    </WorkspacePage>
  );
}
