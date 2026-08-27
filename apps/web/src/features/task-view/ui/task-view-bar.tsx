"use client";

import { useMemo, useState } from "react";
import type { TaskPriority, TaskStatus } from "@tracker/types";
import { Button, Input } from "@tracker/ui";
import clsx from "clsx";
import { useUiStore } from "@/store/use-ui-store";

type TaskViewFilters = {
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  assigneeId: string | "ALL";
};

function areFiltersEqual(left: TaskViewFilters, right: TaskViewFilters) {
  return left.search === right.search && left.status === right.status && left.priority === right.priority && left.assigneeId === right.assigneeId;
}

export function TaskViewBar({ userId }: { userId: string }) {
  const [isComposing, setIsComposing] = useState(false);
  const [name, setName] = useState("");
  const search = useUiStore((state) => state.search);
  const status = useUiStore((state) => state.status);
  const priority = useUiStore((state) => state.priority);
  const assigneeId = useUiStore((state) => state.assigneeId);
  const savedTaskViews = useUiStore((state) => state.savedTaskViews);
  const applyTaskView = useUiStore((state) => state.applyTaskView);
  const deleteTaskView = useUiStore((state) => state.deleteTaskView);
  const saveCurrentTaskView = useUiStore((state) => state.saveCurrentTaskView);

  const currentFilters = useMemo(
    () => ({ search, status, priority, assigneeId }),
    [assigneeId, priority, search, status],
  );

  const presets = useMemo(
    () => [
      {
        id: "all",
        label: "Все задачи",
        filters: { search: "", status: "ALL" as const, priority: "ALL" as const, assigneeId: "ALL" as const },
      },
      {
        id: "mine",
        label: "Моя очередь",
        filters: { search: "", status: "ALL" as const, priority: "ALL" as const, assigneeId: userId },
      },
      {
        id: "review",
        label: "На ревью",
        filters: { search: "", status: "REVIEW" as const, priority: "ALL" as const, assigneeId: "ALL" as const },
      },
      {
        id: "triage",
        label: "Нужен разбор",
        filters: { search: "", status: "TODO" as const, priority: "ALL" as const, assigneeId: "unassigned" },
      },
    ],
    [userId],
  );

  const activePresetId = presets.find((preset) => areFiltersEqual(preset.filters, currentFilters))?.id ?? null;
  const activeSavedViewId = savedTaskViews.find((view) => areFiltersEqual(view, currentFilters))?.id ?? null;
  const hasCustomFilters = !activePresetId && !activeSavedViewId;

  return (
    <section className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
        <span className="shrink-0 px-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Представления</span>
        {presets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyTaskView(preset.filters)}
            className={clsx(
              "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition",
              activePresetId === preset.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {preset.label}
          </button>
        ))}

        {savedTaskViews.map((view) => (
          <div key={view.id} className={clsx("flex shrink-0 items-center rounded-md", activeSavedViewId === view.id ? "bg-accent" : "hover:bg-muted")}>
            <button
              type="button"
              onClick={() => applyTaskView(view)}
              className={clsx("px-3 py-1.5 text-sm font-medium", activeSavedViewId === view.id ? "text-accent-foreground" : "text-muted-foreground")}
            >
              {view.name}
            </button>
            <button
              type="button"
              aria-label={`Удалить view ${view.name}`}
              onClick={() => deleteTaskView(view.id)}
              className="mr-1 rounded px-1.5 py-1 text-xs text-muted-foreground hover:bg-background hover:text-foreground"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {isComposing ? (
        <form
          className="flex shrink-0 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (name.trim().length < 2) return;
            saveCurrentTaskView(name);
            setName("");
            setIsComposing(false);
          }}
        >
          <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Название" className="w-40" />
          <Button type="submit" size="sm">Сохранить</Button>
          <Button type="button" size="sm" variant="ghost" aria-label="Отменить сохранение представления" onClick={() => setIsComposing(false)}>×</Button>
        </form>
      ) : (
        <Button type="button" variant="ghost" size="sm" className="shrink-0" disabled={!hasCustomFilters} onClick={() => setIsComposing(true)}>
          Сохранить
        </Button>
      )}
    </section>
  );
}
