"use client";

import { useState } from "react";
import type { TaskPriority, TaskStatus, UserSummaryDto } from "@tracker/types";
import { Badge, Button, Input, Select, cn } from "@tracker/ui";
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from "@/shared/config/task-options";
import { FilterIcon, SearchIcon } from "@/shared/ui/tracker-icons";
import { useUiStore } from "@/store/use-ui-store";

export function BoardFilter({ users }: { users: UserSummaryDto[] }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const search = useUiStore((state) => state.search);
  const status = useUiStore((state) => state.status);
  const priority = useUiStore((state) => state.priority);
  const assigneeId = useUiStore((state) => state.assigneeId);
  const setSearch = useUiStore((state) => state.setSearch);
  const setStatus = useUiStore((state) => state.setStatus);
  const setPriority = useUiStore((state) => state.setPriority);
  const setAssigneeId = useUiStore((state) => state.setAssigneeId);

  const hasFilters = search.trim().length > 0 || status !== "ALL" || priority !== "ALL" || assigneeId !== "ALL";
  const activeCount = [status !== "ALL", priority !== "ALL", assigneeId !== "ALL"].filter(Boolean).length;

  return (
    <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_150px_150px_190px_auto]">
      <label className="relative block">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text/38" size={18} />
        <Input
          placeholder="Поиск по названию и описанию"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-background pl-10 text-sm"
        />
      </label>

      <Button type="button" variant="outline" className="md:hidden" onClick={() => setFiltersOpen((value) => !value)}>
        <FilterIcon className="mr-2" size={16} />
        Фильтры
        {activeCount ? <Badge className="ml-2">{activeCount}</Badge> : null}
      </Button>

      <div className={cn("grid gap-2 md:contents", !filtersOpen && "hidden md:contents")}>
      <Select
        value={status}
        onChange={(event) => setStatus(event.target.value as TaskStatus | "ALL")}
        className="bg-background text-sm"
      >
        {TASK_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        value={priority}
        onChange={(event) => setPriority(event.target.value as TaskPriority | "ALL")}
        className="bg-background text-sm"
      >
        {TASK_PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        value={assigneeId}
        onChange={(event) => setAssigneeId(event.target.value)}
        className="bg-background text-sm"
      >
        <option value="ALL">Все исполнители</option>
        <option value="unassigned">Без исполнителя</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </Select>

      <Button
        type="button"
        variant="ghost"
        className="text-sm"
        disabled={!hasFilters}
        onClick={() => {
          setSearch("");
          setStatus("ALL");
          setPriority("ALL");
          setAssigneeId("ALL");
        }}
      >
        Сбросить
      </Button>
      </div>
    </div>
  );
}
