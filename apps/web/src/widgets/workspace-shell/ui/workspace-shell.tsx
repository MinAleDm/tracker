"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { OrganizationDto, ProjectDto, TaskDto, TaskStatus, UserSummaryDto } from "@tracker/types";
import { Badge, Button, Card, Select } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { ThemeToggle } from "@/features/theme-toggle/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { priorityLabels, priorityTone, statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { useTaskRealtime } from "@/lib/use-task-realtime";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
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
import { useUiStore } from "@/store/use-ui-store";

export type TaskScope = "all" | "mine" | "unassigned" | "review";

type NavItem = {
  href: Route;
  label: string;
  description: string;
  icon: typeof BoardIcon;
  match: (pathname: string) => boolean;
};

export type WorkspaceData = {
  activeOrganizationId: string | null;
  activeProject: ProjectDto | null;
  isLoadingTasks: boolean;
  members: UserSummaryDto[];
  organizations: OrganizationDto[];
  projects: ProjectDto[];
  selectedProjectId: string | null;
  tasks: TaskDto[];
  userId: string;
  userEmail: string;
  userName: string;
};

const navItems: NavItem[] = [
  {
    href: "/",
    label: "Главная",
    description: "Фокус, риски и быстрые действия",
    icon: DashboardIcon,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/boards",
    label: "Доски",
    description: "Kanban workflow с drag-and-drop",
    icon: BoardIcon,
    match: (pathname) => pathname.startsWith("/boards"),
  },
  {
    href: "/tasks",
    label: "Задачи",
    description: "Список, triage и карточка задачи",
    icon: ListIcon,
    match: (pathname) => pathname.startsWith("/tasks"),
  },
  {
    href: "/analytics",
    label: "Аналитика",
    description: "Прогресс, нагрузка и узкие места",
    icon: ActivityIcon,
    match: (pathname) => pathname.startsWith("/analytics"),
  },
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

function countByStatus(tasks: TaskDto[], status: TaskStatus): number {
  return tasks.filter((task) => task.status === status).length;
}

function getCompletion(tasks: TaskDto[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  return Math.round((countByStatus(tasks, "DONE") / tasks.length) * 100);
}

function sortByFreshness(tasks: TaskDto[]): TaskDto[] {
  return [...tasks].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

export function filterTasksByScope(tasks: TaskDto[], scope: TaskScope, userId?: string): TaskDto[] {
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
  compact,
  onSelect,
}: {
  projects: ProjectDto[];
  selectedProjectId: string | null;
  compact: boolean;
  onSelect: (projectId: string) => void;
}) {
  if (projects.length === 0) {
    return compact ? null : (
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
            title={compact ? project.name : undefined}
            className={clsx(
              "group w-full rounded-3xl border text-left transition",
              compact ? "grid h-12 place-items-center p-0" : "p-4",
              active
                ? "border-white/25 bg-white text-[#172033] shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                : "border-white/10 bg-white/[0.07] text-white hover:border-white/25 hover:bg-white/[0.12]",
            )}
          >
            {compact ? (
              <span className="text-xs font-black uppercase tracking-[-0.08em]">{project.key.slice(0, 2)}</span>
            ) : (
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
            )}
          </button>
        );
      })}
    </div>
  );
}

function WorkspaceSidebar({
  collapsed,
  data,
  onToggle,
}: {
  collapsed: boolean;
  data: WorkspaceData;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const clearSession = useUiStore((state) => state.clearSession);
  const setSelectedOrganizationId = useUiStore((state) => state.setSelectedOrganizationId);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  return (
    <aside
      className={clsx(
        "rounded-[34px] bg-[#111827] p-4 text-white shadow-[0_30px_80px_rgba(15,23,42,0.32)] transition-all duration-300 lg:sticky lg:top-5 lg:max-h-[calc(100vh-40px)] lg:overflow-y-auto",
        collapsed ? "lg:w-[88px]" : "lg:w-[320px]",
      )}
    >
      <div className={clsx("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f97316] text-lg font-black tracking-[-0.08em]">TR</div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Tracker Pro</p>
              <p className="text-xs text-white/48">Workspace OS</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-sm font-black text-white transition hover:bg-white/15 lg:grid"
          aria-label={collapsed ? "Открыть сайдбар" : "Свернуть сайдбар"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-4 grid h-11 w-full place-items-center rounded-2xl bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 lg:hidden"
      >
        {collapsed ? "Открыть меню" : "Свернуть меню"}
      </button>

      {!collapsed ? (
        <div className="mt-7">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/38">Организация</p>
          <Select
            value={data.activeOrganizationId ?? ""}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            className="border-white/10 bg-white/10 py-3 text-sm text-white [color-scheme:dark]"
          >
            {data.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <nav className="mt-7 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "group flex w-full items-center gap-3 rounded-3xl border text-left transition",
                collapsed ? "justify-center px-0 py-3.5" : "px-4 py-3.5",
                active
                  ? "border-white/25 bg-white text-[#172033] shadow-[0_18px_44px_rgba(0,0,0,0.22)]"
                  : "border-white/10 bg-white/[0.06] text-white hover:border-white/25 hover:bg-white/[0.12]",
              )}
            >
              <Icon size={20} />
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={clsx("mt-1 block text-xs", active ? "text-[#687083]" : "text-white/46")}>{item.description}</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-7">
        {!collapsed ? <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/38">Проекты</p> : null}
        <ProjectSwitcher projects={data.projects} selectedProjectId={data.selectedProjectId} compact={collapsed} onSelect={setSelectedProjectId} />
      </div>

      {!collapsed ? (
        <div className="mt-5">
          {data.activeOrganizationId ? <ProjectCreate organizationId={data.activeOrganizationId} /> : null}
        </div>
      ) : null}

      <div className={clsx("mt-7 rounded-3xl bg-white/[0.07] p-3", collapsed ? "text-center" : "")}>
        <div className={clsx("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-sm font-black text-[#111827]">
            {getInitials(data.userName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data.userName}</p>
              <p className="truncate text-xs text-white/42">{data.userEmail}</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-3 flex items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="ghost" className="flex-1 rounded-2xl border-white/10 px-3 text-white hover:bg-white/10" onClick={clearSession}>
              Выйти
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function WorkspaceHero({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: WorkspaceData;
}) {
  return (
    <header className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[#f7efe1] p-6 shadow-[0_24px_70px_rgba(34,39,56,0.10)] md:p-8">
      <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#ff8a3d]/28 blur-3xl" />
      <div className="absolute bottom-0 right-16 h-36 w-36 rounded-full bg-[#0f766e]/18 blur-2xl" />
      <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{data.activeProject?.key ?? "WORKSPACE"}</Badge>
            <Badge tone="success">{data.tasks.length} задач</Badge>
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-text md:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text/62">{description}</p>
        </div>
        <div className="grid min-w-[260px] gap-3 rounded-[28px] bg-white/70 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text/52">Текущий проект</span>
            <span className="font-semibold text-text">{data.activeProject?.name ?? "Не выбран"}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/10">
            <div className="h-full rounded-full bg-[#111827]" style={{ width: `${getCompletion(data.tasks)}%` }} />
          </div>
          <p className="text-xs text-text/48">{getCompletion(data.tasks)}% задач закрыто в текущей выборке.</p>
        </div>
      </div>
    </header>
  );
}

function useWorkspaceData(): WorkspaceData | null {
  const hydrated = useUiStore((state) => state.hydrated);
  const accessToken = useUiStore((state) => state.accessToken);
  const user = useUiStore((state) => state.user);
  const selectedOrganizationId = useUiStore((state) => state.selectedOrganizationId);
  const selectedProjectId = useUiStore((state) => state.selectedProjectId);
  const search = useUiStore((state) => state.search);
  const status = useUiStore((state) => state.status);
  const priority = useUiStore((state) => state.priority);
  const assigneeId = useUiStore((state) => state.assigneeId);
  const setSelectedOrganizationId = useUiStore((state) => state.setSelectedOrganizationId);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  const organizationsQuery = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: apiClient.getOrganizations,
    enabled: Boolean(accessToken),
  });

  const activeOrganizationId = selectedOrganizationId ?? organizationsQuery.data?.[0]?.id ?? null;

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(activeOrganizationId ?? undefined),
    queryFn: () => apiClient.getProjects(activeOrganizationId!),
    enabled: Boolean(accessToken && activeOrganizationId),
  });

  const membersQuery = useQuery({
    queryKey: queryKeys.users(activeOrganizationId ?? undefined),
    queryFn: () => apiClient.getUsers(activeOrganizationId!),
    enabled: Boolean(accessToken && activeOrganizationId),
  });

  useEffect(() => {
    if (!selectedOrganizationId && organizationsQuery.data?.[0]) {
      setSelectedOrganizationId(organizationsQuery.data[0].id);
    }
  }, [organizationsQuery.data, selectedOrganizationId, setSelectedOrganizationId]);

  useEffect(() => {
    const firstProject = projectsQuery.data?.[0];

    if (firstProject && !projectsQuery.data?.some((project) => project.id === selectedProjectId)) {
      setSelectedProjectId(firstProject.id);
    }
  }, [projectsQuery.data, selectedProjectId, setSelectedProjectId]);

  const effectiveProjectId = selectedProjectId ?? projectsQuery.data?.[0]?.id ?? null;

  const taskFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status !== "ALL" ? status : undefined,
      priority: priority !== "ALL" ? priority : undefined,
      assigneeId: assigneeId !== "ALL" ? assigneeId : undefined,
      pageSize: 100,
    }),
    [assigneeId, priority, search, status],
  );

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks(effectiveProjectId ?? undefined, taskFilters),
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("pageSize", String(taskFilters.pageSize));

      if (taskFilters.search) {
        params.set("search", taskFilters.search);
      }

      if (taskFilters.status) {
        params.set("status", taskFilters.status);
      }

      if (taskFilters.priority) {
        params.set("priority", taskFilters.priority);
      }

      if (taskFilters.assigneeId) {
        params.set("assigneeId", taskFilters.assigneeId);
      }

      return apiClient.getTasks(effectiveProjectId!, params);
    },
    enabled: Boolean(accessToken && effectiveProjectId),
  });

  useTaskRealtime(effectiveProjectId);

  if (!hydrated || !accessToken || !user) {
    return null;
  }

  return {
    activeOrganizationId,
    activeProject: projectsQuery.data?.find((project) => project.id === effectiveProjectId) ?? projectsQuery.data?.[0] ?? null,
    isLoadingTasks: tasksQuery.isLoading,
    members: membersQuery.data ?? [],
    organizations: organizationsQuery.data ?? [],
    projects: projectsQuery.data ?? [],
    selectedProjectId: effectiveProjectId,
    tasks: tasksQuery.data?.data ?? [],
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
  };
}

export function WorkspacePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: (data: WorkspaceData) => ReactNode;
}) {
  const router = useRouter();
  const hydrated = useUiStore((state) => state.hydrated);
  const accessToken = useUiStore((state) => state.accessToken);
  const user = useUiStore((state) => state.user);
  const data = useWorkspaceData();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (!hydrated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#eef2f7_40%,#e2e8f0_100%)] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  if (!accessToken || !user) {
    return <SignInForm />;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#eef2f7_40%,#e2e8f0_100%)] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#eef2f7_42%,#dbe7ef_100%)] p-3 text-text md:p-5">
      <div className="mx-auto flex w-full max-w-[1760px] flex-col gap-5 lg:flex-row">
        <WorkspaceSidebar data={data} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
        <section className="min-w-0 flex-1 space-y-5">
          <WorkspaceHero title={title} description={description} data={data} />
          {data.projects.length === 0 ? (
            <EmptyState
              title="Создайте проект"
              description="После создания проекта здесь появятся задачи, доски и рабочая аналитика."
              action="Форма создания проекта находится в левом сайдбаре."
            />
          ) : (
            children(data)
          )}
          <div className="rounded-[28px] border border-white/70 bg-white/55 p-4 text-sm text-text/54 backdrop-blur">
            Быстрая навигация:{" "}
            <button type="button" className="font-semibold text-accent" onClick={() => router.push("/tasks")}>
              открыть список задач
            </button>{" "}
            или{" "}
            <button type="button" className="font-semibold text-accent" onClick={() => router.push("/boards")}>
              перейти на доску
            </button>
            .
          </div>
        </section>
      </div>
    </main>
  );
}

export function OverviewContent({ data, onCreateTask }: { data: WorkspaceData; onCreateTask: () => void }) {
  const freshTasks = sortByFreshness(data.tasks).slice(0, 5);
  const urgentTasks = data.tasks.filter((task) => task.priority === "URGENT" || task.status === "REVIEW").slice(0, 4);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Всего задач" value={data.tasks.length} hint="scope" />
        <StatCard label="В работе" value={countByStatus(data.tasks, "IN_PROGRESS")} hint="delivery" tone="warning" />
        <StatCard label="На ревью" value={countByStatus(data.tasks, "REVIEW")} hint="quality" tone="warning" />
        <StatCard label="Готово" value={`${getCompletion(data.tasks)}%`} hint="done" tone="success" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="border-black/[0.06] bg-white/82 p-5 shadow-[0_18px_45px_rgba(34,39,56,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-text/38">Командный фокус</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Что требует внимания</h2>
            </div>
            <Button type="button" variant="primary" className="rounded-2xl bg-[#111827] px-5 py-3 hover:bg-[#020617]" onClick={onCreateTask}>
              <PlusIcon className="mr-2" size={18} />
              Новая задача
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {urgentTasks.length === 0 ? (
              <EmptyState title="Критичных задач нет" description="Ревью и срочные задачи будут появляться в этом блоке автоматически." />
            ) : (
              urgentTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}` as Route}
                  className="grid gap-3 rounded-[26px] border border-black/[0.06] bg-[#f8fafc] p-4 transition hover:-translate-y-0.5 hover:bg-white md:grid-cols-[120px_minmax(0,1fr)_150px]"
                >
                  <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text/40">{taskKey(task)}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-text">{task.title}</span>
                    <span className="mt-1 block text-sm text-text/50">{task.assignee?.name ?? "Без исполнителя"}</span>
                  </span>
                  <span className="flex items-center gap-2 md:justify-end">
                    <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                    <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card className="border-black/[0.06] bg-[#111827] p-5 text-white shadow-[0_18px_45px_rgba(34,39,56,0.10)]">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-orange-300" />
            <div>
              <p className="text-lg font-semibold">Последние обновления</p>
              <p className="text-sm text-white/46">Свежие изменения в текущем проекте.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {freshTasks.length === 0 ? (
              <p className="rounded-3xl bg-white/10 p-4 text-sm leading-6 text-white/58">Пока нет задач для отображения.</p>
            ) : (
              freshTasks.map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block rounded-3xl bg-white/10 p-4 transition hover:bg-white/15">
                  <p className="line-clamp-1 text-sm font-semibold">{task.title}</p>
                  <p className="mt-2 text-xs text-white/44">Обновлено {formatRelativeDate(task.updatedAt)}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TasksTable({ tasks }: { tasks: TaskDto[] }) {
  if (tasks.length === 0) {
    return <EmptyState title="Задач не найдено" description="Попробуйте сбросить фильтры или создайте новую задачу в выбранном проекте." />;
  }

  return (
    <Card className="overflow-hidden border-black/[0.06] bg-white/82 shadow-[0_18px_45px_rgba(34,39,56,0.06)]">
      <div className="hidden grid-cols-[110px_minmax(0,1.5fr)_150px_150px_170px_120px] gap-4 border-b border-black/[0.06] px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-text/38 xl:grid">
        <span>ID</span>
        <span>Название</span>
        <span>Статус</span>
        <span>Приоритет</span>
        <span>Исполнитель</span>
        <span>Обновлено</span>
      </div>
      <div className="divide-y divide-black/[0.06]">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}` as Route}
            className="grid gap-3 px-5 py-4 transition hover:bg-[#f8fafc] xl:grid-cols-[110px_minmax(0,1.5fr)_150px_150px_170px_120px] xl:items-center"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-text/40">{taskKey(task)}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-text">{task.title}</span>
              <span className="mt-1 block truncate text-sm text-text/48">{task.description || "Описание не заполнено"}</span>
            </span>
            <span>
              <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
            </span>
            <span>
              <Badge tone={priorityTone[task.priority]}>{priorityLabels[task.priority]}</Badge>
            </span>
            <span className="flex items-center gap-2 text-sm text-text/58">
              <UserIcon size={16} />
              {task.assignee?.name ?? "Не назначен"}
            </span>
            <span className="text-sm text-text/46">{formatRelativeDate(task.updatedAt)}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function AnalyticsContent({ data }: { data: WorkspaceData }) {
  const completion = getCompletion(data.tasks);
  const maxCount = Math.max(...statusOrder.map((status) => countByStatus(data.tasks, status)), 1);
  const assigneeGroups = data.members.map((member) => ({
    member,
    count: data.tasks.filter((task) => task.assignee?.id === member.id).length,
  }));

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="border-black/[0.06] bg-white/82 p-5 shadow-[0_18px_45px_rgba(34,39,56,0.06)]">
        <p className="text-sm uppercase tracking-[0.2em] text-text/38">Workflow health</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Распределение по статусам</h2>
        <div className="mt-6 space-y-4">
          {statusOrder.map((status) => {
            const count = countByStatus(data.tasks, status);

            return (
              <div key={status}>
                <div className="flex items-center justify-between gap-4">
                  <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                  <span className="text-sm font-semibold text-text">{count}</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/[0.06]">
                  <div className="h-full rounded-full bg-[#111827]" style={{ width: `${Math.max((count / maxCount) * 100, count ? 8 : 0)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="space-y-5">
        <StatCard label="Готовность" value={`${completion}%`} hint="delivery" tone={completion >= 70 ? "success" : "warning"} />
        <Card className="border-black/[0.06] bg-white/82 p-5 shadow-[0_18px_45px_rgba(34,39,56,0.06)]">
          <p className="text-lg font-semibold text-text">Нагрузка команды</p>
          <div className="mt-4 space-y-3">
            {assigneeGroups.length === 0 ? (
              <p className="text-sm leading-6 text-text/52">Добавьте участников в организацию, чтобы видеть распределение задач.</p>
            ) : (
              assigneeGroups.map(({ member, count }) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] px-4 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-text">{member.name}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-text shadow-sm">{count}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
