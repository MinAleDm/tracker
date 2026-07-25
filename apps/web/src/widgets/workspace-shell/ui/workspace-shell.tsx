"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import type { ProjectDto } from "@tracker/types";
import { Badge, Button, Select } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import {
  ActivityIcon,
  BoardIcon,
  CalendarIcon,
  CheckCircleIcon,
  HistoryIcon,
  ListIcon,
  PlusIcon,
  ProjectsIcon,
  QueueIcon,
  SearchIcon,
  SettingsIcon,
  SparkIcon,
  UserIcon,
} from "@/shared/ui/tracker-icons";
import { countByStatus, getCompletion, taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { getAttentionCounts, getDeliveryStats, getProjectPulse } from "@/widgets/workspace-shell/lib/workspace-insights";
import { useWorkspaceData } from "@/widgets/workspace-shell/model/use-workspace-data";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";
import { useUiStore } from "@/store/use-ui-store";
import { statusLabels, statusOrder, statusTone } from "@/lib/task-meta";
import { getInitials } from "@/shared/lib/utils/string";
import { workspaceNavItems } from "@/widgets/workspace-shell/config/navigation";
import { openWorkspaceCommandMenu, WorkspaceCommandMenu } from "@/widgets/workspace-shell/ui/workspace-command-menu";

export type { TaskScope, WorkspaceData } from "@/widgets/workspace-shell/model/types";
export { filterTasksByScope } from "@/widgets/workspace-shell/lib/task-utils";

type SidebarPanel = "tasks" | "projects" | "goals" | "queues" | "boards" | "dashboards" | "history" | "settings";

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  USER: "Участник",
  OWNER: "Владелец",
  MEMBER: "Участник",
};

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
    return <p className="text-sm leading-6 text-text/52">Создайте первый проект ниже.</p>;
  }

  return (
    <div className="space-y-1">
      {projects.map((project) => {
        const active = project.id === selectedProjectId;

        return (
          <button
            key={project.id}
            type="button"
            onClick={() => onSelect(project.id)}
            className={clsx(
              "group w-full rounded-lg px-3 py-2 text-left text-sm transition",
              active ? "bg-[#1f2937] text-white" : "text-text/64 hover:bg-black/[0.04] hover:text-text",
            )}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-semibold">{project.name}</span>
              <span className={clsx("text-xs", active ? "text-white/54" : "text-text/36")}>{project.key}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function WorkspaceSidebar({
  data,
}: {
  data: WorkspaceData;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<SidebarPanel | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const clearSession = useUiStore((state) => state.clearSession);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);
  const requestTaskCreate = useUiStore((state) => state.requestTaskCreate);

  const navigateTo = (href: Route): void => {
    router.push(href);
    setActivePanel(null);
  };

  const selectProject = (projectId: string): void => {
    setSelectedProjectId(projectId);
    router.push("/tasks");
    setActivePanel(null);
  };

  const openTaskComposer = (): void => {
    if (!data.selectedProjectId) {
      setActivePanel("projects");
      return;
    }

    requestTaskCreate();
    router.push("/tasks");
    setActivePanel(null);
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches("input, textarea, select, [contenteditable='true']");

      if (event.key.toLowerCase() === "c" && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditing) {
        event.preventDefault();
        if (!data.selectedProjectId) {
          setActivePanel("projects");
          return;
        }

        requestTaskCreate();
        router.push("/tasks");
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [data.selectedProjectId, requestTaskCreate, router]);

  const teamRole = roleLabels[data.organizationRole ?? data.userRole] ?? data.organizationRole ?? data.userRole;
  const personalTasks = data.tasks.filter((task) => task.assignee?.id === data.userId || task.creator.id === data.userId);
  const mobileRailItems = [
    {
      id: "tasks",
      label: "Задачи",
      icon: ListIcon,
      active: pathname.startsWith("/tasks"),
      onClick: () => navigateTo("/tasks"),
    },
    {
      id: "projects",
      label: "Проекты",
      icon: ProjectsIcon,
      active: activePanel === "projects",
      onClick: () => setActivePanel("projects"),
    },
    {
      id: "boards",
      label: "Доски",
      icon: BoardIcon,
      active: pathname.startsWith("/boards"),
      onClick: () => navigateTo("/boards"),
    },
    {
      id: "analytics",
      label: "Отчёты",
      icon: ActivityIcon,
      active: pathname.startsWith("/analytics"),
      onClick: () => navigateTo("/analytics"),
    },
    {
      id: "settings",
      label: "Настройки",
      icon: SettingsIcon,
      active: activePanel === "settings",
      onClick: () => setActivePanel("settings"),
    },
  ];

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-border bg-[#f3f4f6] p-3 lg:flex">
        <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#25282e] shadow-sm">
            <span className="h-4 w-4 rounded-full border-[4px] border-white" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-text">Tracker</span>
            <span className="block truncate text-xs text-text/44">
              {data.organizations.find((organization) => organization.id === data.activeOrganizationId)?.name ?? "Workspace"}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={openTaskComposer}
          className="mt-3 flex min-h-10 w-full items-center gap-2.5 rounded-lg bg-accent px-3 text-left text-sm font-semibold text-white shadow-sm transition hover:bg-[#4f5bc2]"
        >
          <PlusIcon size={18} />
          <span>Создать задачу</span>
          <kbd className="ml-auto rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/72">C</kbd>
        </button>

        <button
          type="button"
          onClick={openWorkspaceCommandMenu}
          className="mt-2 flex min-h-10 w-full items-center gap-2.5 rounded-lg border border-border bg-white/70 px-3 text-left text-sm font-medium text-text/54 transition hover:bg-white hover:text-text"
        >
          <SearchIcon size={17} />
          <span>Поиск и команды</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-text/42">Ctrl K</kbd>
        </button>

        <nav aria-label="Основная навигация" className="mt-6 space-y-1">
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text/38">Рабочее пространство</p>
          {workspaceNavItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition",
                  active ? "bg-white text-text shadow-sm" : "text-text/60 hover:bg-white/70 hover:text-text",
                )}
              >
                <Icon size={18} className={active ? "text-accent" : "text-text/46"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 space-y-1">
          <p className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-text/38">Контекст</p>
          {[
            { id: "projects" as const, label: "Проекты", icon: ProjectsIcon, count: data.projects.length },
            { id: "queues" as const, label: "Очереди", icon: QueueIcon, count: personalTasks.length },
            { id: "history" as const, label: "Активность", icon: HistoryIcon, count: null },
          ].map((item) => {
            const Icon = item.icon;
            const active = activePanel === item.id;

            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => setActivePanel(item.id)}
                className={clsx(
                  "flex min-h-10 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm font-medium transition",
                  active ? "bg-white text-text shadow-sm" : "text-text/60 hover:bg-white/70 hover:text-text",
                )}
              >
                <Icon size={18} className={active ? "text-accent" : "text-text/46"} />
                <span>{item.label}</span>
                {item.count !== null ? <span className="ml-auto text-xs tabular-nums text-text/38">{item.count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-auto rounded-xl border border-border bg-white/70 p-2">
          <button
            type="button"
            onClick={() => setActivePanel("projects")}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-white"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent/10 font-mono text-[10px] font-bold text-accent">
              {data.activeProject?.key?.slice(0, 2) ?? "—"}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text">{data.activeProject?.name ?? "Выберите проект"}</span>
              <span className="block text-xs text-text/44">{data.tasks.length} задач</span>
            </span>
          </button>

          <div className="relative mt-1 flex items-center gap-1 border-t border-border pt-2">
            <button
              type="button"
              aria-label="Настройки трекера"
              aria-pressed={activePanel === "settings"}
              onClick={() => {
                setProfileOpen(false);
                setActivePanel("settings");
              }}
              className="grid h-9 w-9 place-items-center rounded-lg text-text/48 transition hover:bg-white hover:text-text"
            >
              <SettingsIcon size={18} />
            </button>

            <button
              type="button"
              aria-label={`Профиль: ${data.userName}`}
              onClick={() => setProfileOpen((value) => !value)}
              className={clsx(
                "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-white",
                profileOpen && "bg-white",
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#25282e] text-[10px] font-bold text-white">
                {getInitials(data.userName)}
              </span>
              <span className="min-w-0 truncate text-xs font-semibold text-text">{data.userName}</span>
            </button>

          {profileOpen ? (
            <div className="absolute bottom-0 left-[232px] z-50 w-[320px] rounded-xl border border-border bg-white p-4 text-text shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{data.userName}</p>
                  <p className="mt-1 truncate text-xs text-text/44">{data.userEmail}</p>
                  <p className="mt-2 text-xs font-semibold text-text/56">Роль в команде: {teamRole}</p>
                </div>
                <Button type="button" variant="ghost" className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50" onClick={clearSession}>
                  Выйти
                </Button>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-lg border border-black/[0.08] px-4 py-3 text-left text-sm font-semibold text-text transition hover:bg-black/[0.035]"
                onClick={clearSession}
              >
                Добавить пользователя
                <span className="mt-1 block text-xs font-normal text-text/44">Выйти на экран входа и авторизоваться ещё раз.</span>
              </button>
            </div>
          ) : null}
          </div>
        </div>
      </aside>

      {activePanel ? (
        <div className="fixed inset-0 z-40 lg:left-[240px]">
          <button
            type="button"
            aria-label="Закрыть панель"
            className="absolute inset-0 cursor-default bg-[#111827]/38 backdrop-blur-[1px]"
            onClick={() => setActivePanel(null)}
          />
          <aside className="relative h-full w-full max-w-[420px] overflow-y-auto bg-white px-6 py-7 shadow-[26px_0_70px_rgba(15,23,42,0.22)]">
            <div className="absolute right-4 top-4">
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-sm font-semibold text-text/52 transition hover:bg-black/[0.04] hover:text-text"
                onClick={() => setActivePanel(null)}
              >
                Закрыть
              </button>
            </div>

        {activePanel === "tasks" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Задачи</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Мои задачи</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {personalTasks.slice(0, 8).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-3 transition hover:bg-black/[0.025]" onClick={() => setActivePanel(null)}>
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase text-text/36">{taskKey(task)}</span>
                    <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/tasks")}>
              Открыть список
            </Button>
          </div>
        ) : null}

        {activePanel === "boards" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Доски</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Статусы</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {statusOrder.map((status) => (
                <button key={status} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => navigateTo("/boards")}>
                  <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                  <span className="text-sm font-semibold text-text">{countByStatus(data.tasks, status)}</span>
                </button>
              ))}
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/boards")}>
              Открыть доску
            </Button>
          </div>
        ) : null}

        {activePanel === "projects" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Проекты и портфели</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Выбор проекта</h2>
            <p className="mt-2 text-sm leading-6 text-text/52">Выберите проект или портфель, чтобы открыть задачи по нему.</p>
            <div className="mt-6">
              <ProjectSwitcher projects={data.projects} selectedProjectId={data.selectedProjectId} onSelect={selectProject} />
            </div>
            {data.activeOrganizationId ? (
              <div className="mt-6 border-t border-black/[0.08] pt-5">
                <ProjectCreate organizationId={data.activeOrganizationId} />
              </div>
            ) : null}
          </div>
        ) : null}

        {activePanel === "goals" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Цели</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Цели команды</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5 text-sm leading-6 text-text/56">
              Цели будут связывать задачи с результатами команды. Сейчас можно использовать задачи с высоким приоритетом как ближайший фокус.
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/tasks")}>
              Смотреть фокусные задачи
            </Button>
          </div>
        ) : null}

        {activePanel === "queues" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Очереди</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Рабочие очереди</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => navigateTo("/tasks")}>
                <span className="text-sm font-semibold text-text">Мои задачи</span>
                <span className="text-sm text-text/52">
                  {data.tasks.filter((task) => task.assignee?.id === data.userId || task.creator.id === data.userId).length}
                </span>
              </button>
              <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => navigateTo("/tasks")}>
                <span className="text-sm font-semibold text-text">Без исполнителя</span>
                <span className="text-sm text-text/52">{data.tasks.filter((task) => !task.assignee).length}</span>
              </button>
              <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => navigateTo("/tasks")}>
                <span className="text-sm font-semibold text-text">На ревью</span>
                <span className="text-sm text-text/52">{countByStatus(data.tasks, "REVIEW")}</span>
              </button>
            </div>
          </div>
        ) : null}

        {activePanel === "dashboards" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Дашборд и отчёты</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Прогресс</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5">
              <p className="text-6xl font-semibold tracking-normal text-text">{getCompletion(data.tasks)}%</p>
              <p className="mt-3 text-sm leading-6 text-text/56">Готовность по текущей выборке задач проекта.</p>
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/analytics")}>
              Открыть отчёты
            </Button>
          </div>
        ) : null}

        {activePanel === "history" ? (
          <div>
            <p className="text-xs uppercase text-text/36">История</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Последние изменения</h2>
            <div className="mt-5 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {data.tasks.slice(0, 6).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-3 transition hover:bg-black/[0.025]" onClick={() => setActivePanel(null)}>
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <p className="mt-1 text-xs text-text/42">Обновлено {formatRelativeDate(task.updatedAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {activePanel === "settings" ? (
          <div>
            <p className="text-xs uppercase text-text/36">Настройки</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal text-text">Настройки трекера</h2>
            <p className="mt-2 text-sm leading-6 text-text/52">
              Быстрый доступ к рабочему контексту, проекту и основным разделам без расширения сайдбара.
            </p>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              <div className="py-3">
                <p className="text-xs uppercase text-text/36">Пользователь</p>
                <p className="mt-1 text-sm font-semibold text-text">{data.userName}</p>
                <p className="mt-1 text-xs text-text/44">Роль в команде: {teamRole}</p>
              </div>
              <div className="py-3">
                <p className="text-xs uppercase text-text/36">Текущий проект</p>
                <p className="mt-1 text-sm font-semibold text-text">{data.activeProject?.name ?? "Проект не выбран"}</p>
                <p className="mt-1 text-xs text-text/44">
                  {data.activeProject ? `Ключ проекта: ${data.activeProject.key}` : "Выберите проект через раздел проектов и портфелей."}
                </p>
              </div>
              <button type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => setActivePanel("projects")}>
                <span className="text-sm font-semibold text-text">Управлять проектами</span>
                <span className="text-sm text-text/42">{data.projects.length}</span>
              </button>
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/pages/my")}>
              Открыть главную
            </Button>
          </div>
        ) : null}
          </aside>
        </div>
      ) : null}

      <div className="border-b border-black/[0.08] bg-[#eef1f3]/96 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#f97316] shadow-sm">
              <span className="h-4 w-4 rounded-full border-4 border-white" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text">{data.activeProject?.name ?? "Проект не выбран"}</p>
              <p className="truncate text-xs text-text/46">{personalTasks.length} моих задач</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Открыть поиск и команды"
              onClick={openWorkspaceCommandMenu}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-white text-text/54 shadow-sm"
            >
              <SearchIcon size={18} />
            </button>
            <button
              type="button"
              aria-label="Создать задачу"
              onClick={openTaskComposer}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#111827] text-white shadow-sm"
            >
              <PlusIcon size={18} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          {mobileRailItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={item.onClick}
                className={clsx(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
                  item.active ? "bg-white text-[#111827] shadow-sm" : "text-text/56 hover:bg-white/70 hover:text-text",
                )}
              >
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function WorkspaceHeader({
  title,
  description,
  data,
}: {
  title: string;
  description: string;
  data: WorkspaceData;
}) {
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);
  const attention = getAttentionCounts(data.tasks);
  const delivery = getDeliveryStats(data.tasks);
  const pulse = getProjectPulse(data.tasks);
  const highlights = [
    {
      label: "Готовность",
      value: `${getCompletion(data.tasks)}%`,
      icon: CheckCircleIcon,
    },
    {
      label: "На ревью",
      value: attention.review,
      icon: SparkIcon,
    },
    {
      label: "Без исполнителя",
      value: attention.unassigned,
      icon: UserIcon,
    },
    {
      label: "Delivery 7d",
      value: `${delivery.closed}/${delivery.created}`,
      icon: CalendarIcon,
    },
  ];

  return (
    <header className="tracker-panel rounded-xl px-4 py-4 md:px-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text/44">
            <span>{data.organizations.find((organization) => organization.id === data.activeOrganizationId)?.name ?? "Workspace"}</span>
            <span aria-hidden="true">/</span>
            <span className="font-mono font-semibold text-text/58">{data.activeProject?.key ?? "PROJECT"}</span>
            <span className="rounded-md bg-accent/10 px-2 py-0.5 font-semibold text-accent">{pulse.label}</span>
          </div>
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-[-0.02em] text-text md:text-[28px]">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-text/54">{description}</p>
        </div>

        <div className="flex min-w-0 flex-col gap-3 xl:w-[620px] xl:items-end">
          {data.projects.length > 0 ? (
            <Select
              aria-label="Текущий проект"
              value={data.selectedProjectId ?? ""}
              onChange={(event) => setSelectedProjectId(event.target.value || null)}
              className="max-w-full bg-white py-2 text-xs font-semibold sm:w-[260px]"
            >
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.key} · {project.name}
                </option>
              ))}
            </Select>
          ) : null}

          <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.label} className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2">
                  <Icon size={15} className="shrink-0 text-text/36" />
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-medium text-text/42">{item.label}</span>
                    <span className="block text-sm font-semibold tabular-nums text-text">{item.value}</span>
                  </span>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
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
  const hydrated = useUiStore((state) => state.hydrated);
  const accessToken = useUiStore((state) => state.accessToken);
  const user = useUiStore((state) => state.user);
  const data = useWorkspaceData();

  if (!hydrated) {
    return (
      <main id="main-content" className="min-h-screen bg-[#f6f7f9] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  if (!accessToken || !user) {
    return <SignInForm />;
  }

  if (!data) {
    return (
      <main id="main-content" className="min-h-screen bg-[#f6f7f9] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  if (data.isLoadingWorkspace) {
    return (
      <main id="main-content" className="min-h-screen bg-surface p-5">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-5 h-24 animate-pulse rounded-xl border border-border bg-card" />
          <SkeletonBoard />
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="min-h-screen bg-[#f6f7f9] text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <WorkspaceSidebar data={data} />
        <WorkspaceCommandMenu hasProject={Boolean(data.selectedProjectId)} userId={data.userId} />
        <section className="min-w-0 flex-1 px-3 py-4 md:px-5 lg:px-6">
          <div className="mx-auto max-w-[1440px] space-y-4">
            <WorkspaceHeader title={title} description={description} data={data} />
            {data.workspaceError ? (
              <section className="tracker-panel rounded-xl px-6 py-12 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <ActivityIcon size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-text">Не удалось загрузить рабочее пространство</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-text/54">
                  Проверьте соединение с API и повторите запрос. Ваша сессия и локальные фильтры сохранены.
                </p>
                <Button type="button" variant="primary" className="mt-5" onClick={data.retryWorkspace}>
                  Повторить
                </Button>
              </section>
            ) : data.projects.length === 0 ? (
              <EmptyState
                title="Создайте проект"
                description="После создания проекта здесь появятся задачи, доски и рабочая аналитика."
                action="Форма создания проекта находится в левом сайдбаре."
              />
            ) : (
              children(data)
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
