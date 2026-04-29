"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectDto, TaskDto, TaskStatus, UserSummaryDto } from "@tracker/types";
import { Badge, Button, Card, Select } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { BoardFilter } from "@/features/board-filter/ui/board-filter";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { TaskCreate } from "@/features/task-create/ui/task-create";
import { TaskModal } from "@/features/task-modal/ui/task-modal";
import { ThemeToggle } from "@/features/theme-toggle/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";
import { priorityLabels, priorityTone, statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { queryKeys } from "@/lib/query-keys";
import { useTaskRealtime } from "@/lib/use-task-realtime";
import { formatDate, formatRelativeDate } from "@/shared/lib/utils/date";
import {
  ActivityIcon,
  BoardIcon,
  CalendarIcon,
  DashboardIcon,
  ListIcon,
  PlusIcon,
  ProjectsIcon,
  SparkIcon,
  UserIcon,
} from "@/shared/ui/tracker-icons";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { useUiStore } from "@/store/use-ui-store";
import { KanbanBoard } from "@/widgets/kanban-board/ui/kanban-board";

type WorkspaceView = "overview" | "board" | "list" | "analytics";
type TaskScope = "all" | "mine" | "unassigned" | "review";

const workspaceViews: Array<{ id: WorkspaceView; label: string; description: string; icon: typeof BoardIcon }> = [
  { id: "overview", label: "Обзор", description: "Фокус, риски и последние изменения", icon: DashboardIcon },
  { id: "board", label: "Доска", description: "Kanban workflow с drag-and-drop", icon: BoardIcon },
  { id: "list", label: "Список", description: "Плотная таблица для triage", icon: ListIcon },
  { id: "analytics", label: "Аналитика", description: "Нагрузка и прогресс команды", icon: ActivityIcon },
];

function getInitials(value: string): string {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "TR";
}

function taskKey(task: TaskDto): string {
  return task.id.slice(-8).toUpperCase();
}

function filterTasksByScope(tasks: TaskDto[], scope: TaskScope, userId?: string): TaskDto[] {
  // Локальный scope накладывается поверх серверных фильтров, чтобы переключение было мгновенным.
  if (scope === "mine") {
    return tasks.filter((task) => task.assignee?.id === userId || task.creator.id === userId);
  }

  if (scope === "unassigned") {
    return tasks.filter((task) => !task.assignee);
  }

  if (scope === "review") {
    return tasks.filter((task) => task.status === "REVIEW");
  }

  return tasks;
}

function countByStatus(tasks: TaskDto[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

function getCompletion(tasks: TaskDto[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  return Math.round((countByStatus(tasks, "DONE") / tasks.length) * 100);
}

function getAgeScore(task: TaskDto): number {
  return new Date(task.updatedAt).getTime();
}

function sortByFreshness(tasks: TaskDto[]): TaskDto[] {
  return [...tasks].sort((left, right) => getAgeScore(right) - getAgeScore(left));
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: string;
}) {
  return (
    <Card className="border-dashed border-black/10 bg-white/75 p-10 text-center shadow-none">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--accent-soft)] text-accent">
        <SparkIcon />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-text">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/60">{description}</p>
      {action ? <p className="mt-4 text-sm font-semibold text-accent">{action}</p> : null}
    </Card>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  hint: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_45px_rgba(34,39,56,0.08)] backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text/58">{label}</p>
        <Badge tone={tone}>{hint}</Badge>
      </div>
      <p className="mt-5 text-4xl font-semibold tracking-[-0.04em] text-text">{value}</p>
    </div>
  );
}

function ProjectSwitcher({
  projects,
  selectedProjectId,
  onSelect,
}: {
  projects: ProjectDto[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}) {
  if (projects.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/30 bg-white/10 p-5 text-sm leading-6 text-white/70">
        В организации пока нет проектов. Создайте первый проект, чтобы начать работу с задачами.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const active = project.id === selectedProjectId;

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project.id)}
            className={clsx(
              "group w-full rounded-3xl border p-4 text-left transition",
              active
                ? "border-white/25 bg-white text-[#172033] shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                : "border-white/10 bg-white/[0.07] text-white hover:border-white/25 hover:bg-white/[0.12]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{project.name}</p>
                <p className={clsx("mt-1 text-xs uppercase tracking-[0.2em]", active ? "text-[#687083]" : "text-white/48")}>
                  {project.key}
                </p>
              </div>
              <span
                className={clsx(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  active ? "bg-[#eef2f7] text-[#687083]" : "bg-white/10 text-white/70",
                )}
              >
                {project.taskCount ?? 0}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Sidebar({
  userName,
  userEmail,
  projects,
  selectedProjectId,
  activeView,
  activeOrganizationId,
  organizations,
  canCreateProject,
  onSelectProject,
  onSelectView,
  onSelectOrganization,
  onLogout,
}: {
  userName: string;
  userEmail: string;
  projects: ProjectDto[];
  selectedProjectId: string | null;
  activeView: WorkspaceView;
  activeOrganizationId: string | null;
  organizations: Array<{ id: string; name: string }>;
  canCreateProject: boolean;
  onSelectProject: (projectId: string) => void;
  onSelectView: (view: WorkspaceView) => void;
  onSelectOrganization: (organizationId: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="rounded-[34px] bg-[#111827] p-5 text-white shadow-[0_30px_80px_rgba(15,23,42,0.32)] lg:sticky lg:top-5 lg:max-h-[calc(100vh-40px)] lg:overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f97316] text-lg font-black tracking-[-0.08em]">
          TR
        </div>
        <div>
          <p className="text-sm font-semibold">Tracker Pro</p>
          <p className="text-xs text-white/48">Workspace OS</p>
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/38">Организация</p>
        <Select
          value={activeOrganizationId ?? ""}
          onChange={(event) => onSelectOrganization(event.target.value)}
          className="border-white/10 bg-white/10 py-3 text-sm text-white [color-scheme:dark]"
        >
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </Select>
      </div>

      <nav className="mt-7 space-y-2">
        {workspaceViews.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeView;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectView(item.id)}
              className={clsx(
                "flex w-full items-start gap-3 rounded-3xl px-4 py-3.5 text-left transition",
                active ? "bg-white text-[#172033]" : "text-white/74 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="mt-0.5" />
              <span>
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className={clsx("mt-1 block text-xs leading-5", active ? "text-[#687083]" : "text-white/42")}>
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.22em] text-white/38">Проекты</p>
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/60">{projects.length}</span>
        </div>
        <ProjectSwitcher projects={projects} selectedProjectId={selectedProjectId} onSelect={onSelectProject} />
      </div>

      {canCreateProject && activeOrganizationId ? (
        <div className="mt-5 rounded-3xl bg-white/[0.06] p-4">
          <ProjectCreate organizationId={activeOrganizationId} />
        </div>
      ) : null}

      <div className="mt-8 rounded-3xl bg-white/[0.07] p-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-sm font-bold text-[#111827]">
            {getInitials(userName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-white/46">{userEmail}</p>
          </div>
          <ThemeToggle />
        </div>
        <Button type="button" variant="ghost" className="mt-4 w-full rounded-2xl text-white hover:bg-white/10" onClick={onLogout}>
          Выйти
        </Button>
      </div>
    </aside>
  );
}

function WorkspaceHeader({
  project,
  tasks,
  visibleTasks,
  members,
  onCreateFocus,
}: {
  project: ProjectDto | null;
  tasks: TaskDto[];
  visibleTasks: TaskDto[];
  members: UserSummaryDto[];
  onCreateFocus: () => void;
}) {
  const completion = getCompletion(tasks);
  const comments = tasks.reduce((sum, task) => sum + task.commentsCount, 0);
  const recentlyUpdated = sortByFreshness(tasks)[0];

  return (
    <Card className="overflow-hidden border-white/70 bg-white/72 shadow-[0_28px_80px_rgba(34,39,56,0.10)] backdrop-blur">
      <div className="relative p-6 md:p-8">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <div className="relative flex flex-col gap-7 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="max-w-4xl">
            <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-text/58">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-3 py-1.5 font-semibold text-white">
                <ProjectsIcon size={16} />
                {project?.key ?? "TRACKER"}
              </span>
              <span>Команда: {members.length || 1}</span>
              <span>Последнее обновление: {recentlyUpdated ? formatRelativeDate(recentlyUpdated.updatedAt) : "нет данных"}</span>
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.055em] text-text md:text-6xl">
              {project?.name ?? "Выберите проект"}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text/62 md:text-lg">
              {project?.description ??
                "Проект появится здесь после выбора в боковой панели. Доска, список и аналитика синхронизированы с API и realtime-событиями."}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 2xl:min-w-[520px]">
            <StatCard label="Всего задач" value={tasks.length} hint={`${visibleTasks.length} в фокусе`} />
            <StatCard label="Готовность" value={`${completion}%`} hint="Done" tone="success" />
            <StatCard label="В работе" value={countByStatus(tasks, "IN_PROGRESS")} hint="Flow" tone="warning" />
            <StatCard label="Комментарии" value={comments} hint="Context" />
          </div>
        </div>

        <div className="relative mt-7 flex flex-col gap-4 rounded-[30px] bg-[#111827] p-4 text-white md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/12">
              <SparkIcon />
            </div>
            <div>
              <p className="text-sm font-semibold">Рабочий фокус</p>
              <p className="text-xs text-white/48">Сначала закрываем review и срочные задачи, потом расширяем поток.</p>
            </div>
          </div>
          <Button type="button" variant="primary" className="rounded-2xl bg-[#f97316] px-5 py-3 hover:bg-[#ea580c]" onClick={onCreateFocus}>
            <PlusIcon className="mr-2" />
            Быстро добавить
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ScopeTabs({ scope, onChange }: { scope: TaskScope; onChange: (scope: TaskScope) => void }) {
  const items: Array<{ id: TaskScope; label: string }> = [
    { id: "all", label: "Все" },
    { id: "mine", label: "Мои" },
    { id: "unassigned", label: "Без исполнителя" },
    { id: "review", label: "На ревью" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={clsx(
            "rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
            scope === item.id ? "bg-[#111827] text-white shadow-lg shadow-slate-900/10" : "bg-white text-text/62 hover:text-text",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function ViewTabs({ activeView, onChange }: { activeView: WorkspaceView; onChange: (view: WorkspaceView) => void }) {
  return (
    <div className="grid gap-2 rounded-[28px] bg-white/66 p-2 shadow-[0_16px_45px_rgba(34,39,56,0.08)] backdrop-blur md:grid-cols-4">
      {workspaceViews.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={clsx(
              "flex items-center justify-center gap-2 rounded-3xl px-4 py-3 text-sm font-semibold transition",
              activeView === item.id ? "bg-[#111827] text-white" : "text-text/58 hover:bg-white hover:text-text",
            )}
          >
            <Icon size={18} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function TaskRow({ task, onOpen }: { task: TaskDto; onOpen: (taskId: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(task.id)}
      className="grid w-full gap-4 border-b border-black/[0.06] px-5 py-4 text-left transition last:border-b-0 hover:bg-[#f8fafc] lg:grid-cols-[120px_minmax(0,1.4fr)_190px_150px_130px]"
    >
      <div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-text/44">{taskKey(task)}</p>
        <p className="mt-2 text-xs text-text/44">{formatDate(task.createdAt)}</p>
      </div>
      <div className="min-w-0">
        <p className="line-clamp-1 text-base font-semibold text-text">{task.title}</p>
        <p className="mt-1 line-clamp-1 text-sm text-text/56">{task.description || "Описание не заполнено"}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--accent-soft)] text-xs font-bold text-accent">
          {getInitials(task.assignee?.name ?? "UN")}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">{task.assignee?.name ?? "Не назначен"}</p>
          <p className="truncate text-xs text-text/44">{task.creator.name}</p>
        </div>
      </div>
      <div className="flex items-center">
        <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
      </div>
      <div className="space-y-1">
        <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
        <p className="text-xs text-text/44">{formatRelativeDate(task.updatedAt)}</p>
      </div>
    </button>
  );
}

function TaskList({ tasks, onOpen }: { tasks: TaskDto[]; onOpen: (taskId: string) => void }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        title="По текущим фильтрам задач нет"
        description="Очистите фильтры, смените проект или создайте новую задачу. Пустой список тут не ошибка, а хорошая пауза."
        action="Фильтры находятся над списком"
      />
    );
  }

  return (
    <Card className="overflow-hidden border-white/80 bg-white/86 shadow-[0_24px_70px_rgba(34,39,56,0.09)]">
      <div className="hidden grid-cols-[120px_minmax(0,1.4fr)_190px_150px_130px] gap-4 border-b border-black/[0.06] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-text/38 lg:grid">
        <span>Ключ</span>
        <span>Задача</span>
        <span>Исполнитель</span>
        <span>Статус</span>
        <span>Приоритет</span>
      </div>
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} onOpen={onOpen} />
      ))}
    </Card>
  );
}

function FocusQueue({ tasks, onOpen }: { tasks: TaskDto[]; onOpen: (taskId: string) => void }) {
  const focusTasks = [...tasks]
    .sort((left, right) => {
      const rank = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      return rank[right.priority] - rank[left.priority] || getAgeScore(right) - getAgeScore(left);
    })
    .slice(0, 5);

  return (
    <Card className="border-white/80 bg-white/86 p-5 shadow-[0_24px_70px_rgba(34,39,56,0.09)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-text">Фокус очереди</p>
          <p className="mt-1 text-sm text-text/52">Что стоит разобрать первым.</p>
        </div>
        <Badge tone="warning">Priority</Badge>
      </div>

      <div className="mt-5 space-y-3">
        {focusTasks.length === 0 ? (
          <div className="rounded-3xl bg-[#f8fafc] px-4 py-8 text-center text-sm text-text/52">Очередь пуста.</div>
        ) : (
          focusTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpen(task.id)}
              className="w-full rounded-3xl border border-black/[0.06] bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold tracking-[0.15em] text-text/38">{taskKey(task)}</p>
                  <p className="mt-2 line-clamp-2 font-semibold text-text">{task.title}</p>
                </div>
                <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-text/48">
                <span>{task.assignee?.name ?? "Не назначен"}</span>
                <span>{formatRelativeDate(task.updatedAt)}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </Card>
  );
}

function Overview({ tasks, onOpen }: { tasks: TaskDto[]; onOpen: (taskId: string) => void }) {
  const latest = sortByFreshness(tasks).slice(0, 6);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-4">
          {statusOrder.map((status) => {
            const value = countByStatus(tasks, status);
            const width = tasks.length ? Math.round((value / tasks.length) * 100) : 0;

            return (
              <Card key={status} className="border-white/80 bg-white/86 p-5 shadow-none">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-text/58">{statusLabels[status]}</p>
                  <Badge tone={statusTone[status]}>{value}</Badge>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#e8edf4]">
                  <div className="h-full rounded-full bg-[#111827]" style={{ width: `${width}%` }} />
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="border-white/80 bg-white/86 p-5 shadow-[0_24px_70px_rgba(34,39,56,0.09)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-text">Последние изменения</p>
              <p className="mt-1 text-sm text-text/52">Живая лента задач, которые недавно двигались.</p>
            </div>
            <CalendarIcon className="text-accent" />
          </div>

          <div className="mt-5 space-y-3">
            {latest.length === 0 ? (
              <EmptyState title="История пока пустая" description="После создания задач здесь появятся последние изменения." />
            ) : (
              latest.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onOpen(task.id)}
                  className="grid w-full gap-4 rounded-3xl border border-black/[0.06] bg-white px-4 py-4 text-left transition hover:bg-[#f8fafc] md:grid-cols-[minmax(0,1fr)_160px_110px]"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 font-semibold text-text">{task.title}</p>
                    <p className="mt-1 text-sm text-text/50">
                      {taskKey(task)} · {task.assignee?.name ?? "Не назначен"}
                    </p>
                  </div>
                  <span className="text-sm text-text/54">{formatRelativeDate(task.updatedAt)}</span>
                  <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      <FocusQueue tasks={tasks} onOpen={onOpen} />
    </div>
  );
}

function Analytics({ tasks, members }: { tasks: TaskDto[]; members: UserSummaryDto[] }) {
  const load = members
    .map((member) => ({
      member,
      total: tasks.filter((task) => task.assignee?.id === member.id).length,
      active: tasks.filter((task) => task.assignee?.id === member.id && task.status !== "DONE").length,
    }))
    .sort((left, right) => right.active - left.active);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card className="border-white/80 bg-white/86 p-6 shadow-[0_24px_70px_rgba(34,39,56,0.09)]">
        <p className="text-xl font-semibold text-text">Здоровье workflow</p>
        <p className="mt-2 text-sm text-text/52">Сколько задач находится в каждом состоянии и где копится очередь.</p>
        <div className="mt-7 space-y-5">
          {statusOrder.map((status) => {
            const value = countByStatus(tasks, status);
            const width = tasks.length ? Math.round((value / tasks.length) * 100) : 0;

            return (
              <div key={status}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-text">{statusLabels[status]}</span>
                  <span className="text-text/50">{value} задач · {width}%</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-[#e8edf4]">
                  <div className="h-full rounded-full bg-[#111827]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-white/80 bg-white/86 p-6 shadow-[0_24px_70px_rgba(34,39,56,0.09)]">
        <p className="text-xl font-semibold text-text">Нагрузка команды</p>
        <p className="mt-2 text-sm text-text/52">Активные задачи по исполнителям.</p>
        <div className="mt-6 space-y-3">
          {load.length === 0 ? (
            <div className="rounded-3xl bg-[#f8fafc] px-4 py-8 text-center text-sm text-text/52">
              Пока нет участников с назначенными задачами.
            </div>
          ) : (
            load.map(({ member, total, active }) => (
              <div key={member.id} className="rounded-3xl border border-black/[0.06] bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#111827] text-xs font-bold text-white">
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">{member.name}</p>
                      <p className="truncate text-xs text-text/44">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text">{active}</p>
                    <p className="text-xs text-text/44">из {total}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export function AppShell() {
  const hydrated = useUiStore((state) => state.hydrated);
  const user = useUiStore((state) => state.user);
  const accessToken = useUiStore((state) => state.accessToken);
  const selectedOrganizationId = useUiStore((state) => state.selectedOrganizationId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);
  const search = useUiStore((state) => state.search);
  const status = useUiStore((state) => state.status);
  const priority = useUiStore((state) => state.priority);
  const assigneeId = useUiStore((state) => state.assigneeId);
  const clearSession = useUiStore((state) => state.clearSession);
  const openTask = useUiStore((state) => state.openTask);
  const setSelectedOrganizationId = useUiStore((state) => state.setSelectedOrganizationId);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  const [activeView, setActiveView] = useState<WorkspaceView>("board");
  const [scope, setScope] = useState<TaskScope>("all");
  const [composerFocus, setComposerFocus] = useState(0);

  const organizationsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: () => apiClient.getOrganizations(),
    enabled: Boolean(accessToken),
  });

  const activeOrganizationId = selectedOrganizationId ?? organizationsQuery.data?.[0]?.id ?? null;

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(activeOrganizationId ?? undefined),
    queryFn: () => apiClient.getProjects(activeOrganizationId!),
    enabled: Boolean(accessToken && activeOrganizationId),
  });

  const usersQuery = useQuery({
    queryKey: queryKeys.users(activeOrganizationId ?? undefined),
    queryFn: () => apiClient.getUsers(activeOrganizationId!),
    enabled: Boolean(accessToken && activeOrganizationId),
  });

  // Сервер остаётся источником правды: поиск и основные фильтры уходят в API.
  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(selectedProjectId ?? undefined, {
      search,
      status,
      priority,
      assigneeId,
      pageSize: 100,
    }),
    queryFn: () => {
      const params = new URLSearchParams();

      if (search) {
        params.set("search", search);
      }

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (priority !== "ALL") {
        params.set("priority", priority);
      }

      if (assigneeId === "unassigned") {
        params.set("assigneeId", "unassigned");
      } else if (assigneeId !== "ALL") {
        params.set("assigneeId", assigneeId);
      }

      params.set("pageSize", "100");

      return apiClient.getTasks(selectedProjectId!, params);
    },
    enabled: Boolean(accessToken && selectedProjectId),
  });

  useTaskRealtime(selectedProjectId);

  useEffect(() => {
    if (!selectedOrganizationId && organizationsQuery.data?.[0]) {
      setSelectedOrganizationId(organizationsQuery.data[0].id);
    }
  }, [organizationsQuery.data, selectedOrganizationId, setSelectedOrganizationId]);

  useEffect(() => {
    if (!selectedProjectId && projectsQuery.data?.[0]) {
      setSelectedProjectId(projectsQuery.data[0].id);
    }
  }, [projectsQuery.data, selectedProjectId, setSelectedProjectId]);

  if (!hydrated) {
    return <SkeletonBoard />;
  }

  if (!accessToken || !user) {
    return <SignInForm />;
  }

  const organizations = organizationsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const members = usersQuery.data ?? [];
  const activeProject = projects.find((project) => project.id === selectedProjectId) ?? null;
  const tasks = tasksQuery.data?.data ?? [];
  const visibleTasks = filterTasksByScope(tasks, scope, user.id);
  const hasProject = Boolean(selectedProjectId);
  const hasError = organizationsQuery.isError || projectsQuery.isError || usersQuery.isError || tasksQuery.isError;

  return (
    <main className="min-h-screen bg-surface p-3 text-text md:p-5">
      <div className="mx-auto grid max-w-[1840px] gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
        <Sidebar
          userName={user.name}
          userEmail={user.email}
          projects={projects}
          selectedProjectId={selectedProjectId}
          activeView={activeView}
          activeOrganizationId={activeOrganizationId}
          organizations={organizations}
          canCreateProject={user.role === "ADMIN"}
          onSelectProject={setSelectedProjectId}
          onSelectView={setActiveView}
          onSelectOrganization={setSelectedOrganizationId}
          onLogout={clearSession}
        />

        <section className="min-w-0 space-y-5">
          <WorkspaceHeader
            project={activeProject}
            tasks={tasks}
            visibleTasks={visibleTasks}
            members={members}
            onCreateFocus={() => setComposerFocus((value) => value + 1)}
          />

          {hasError ? (
            <EmptyState
              title="Не удалось загрузить данные"
              description="Проверьте API-контейнер и повторите запрос. Интерфейс сохранил сессию, так что можно просто обновить страницу после восстановления."
            />
          ) : null}

          <Card className="border-white/80 bg-white/70 p-4 shadow-[0_24px_70px_rgba(34,39,56,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <ViewTabs activeView={activeView} onChange={setActiveView} />
              <ScopeTabs scope={scope} onChange={setScope} />
            </div>
            <div className="mt-4">
              <BoardFilter users={members} />
            </div>
            {hasProject ? (
              <div className="mt-4">
                <TaskCreate projectId={selectedProjectId!} users={members} focusSignal={composerFocus} />
              </div>
            ) : null}
          </Card>

          {!hasProject ? (
            <EmptyState
              title="Выберите или создайте проект"
              description="Все рабочие представления привязаны к проекту: доска, список, аналитика и realtime-обновления."
            />
          ) : tasksQuery.isLoading || tasksQuery.isFetching && tasks.length === 0 ? (
            <SkeletonBoard />
          ) : (
            <>
              {activeView === "overview" ? <Overview tasks={visibleTasks} onOpen={openTask} /> : null}
              {activeView === "board" ? <KanbanBoard tasks={visibleTasks} /> : null}
              {activeView === "list" ? <TaskList tasks={visibleTasks} onOpen={openTask} /> : null}
              {activeView === "analytics" ? <Analytics tasks={visibleTasks} members={members} /> : null}
            </>
          )}
        </section>
      </div>

      <TaskModal users={members} tasks={tasks} project={activeProject} />
    </main>
  );
}
