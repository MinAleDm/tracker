"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import type { ProjectDto } from "@tracker/types";
import { Badge, Button, Select } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { ThemeToggle } from "@/features/theme-toggle/ui/theme-toggle";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import { BellIcon, HelpIcon, ProjectsIcon, SettingsIcon, UserIcon } from "@/shared/ui/tracker-icons";
import { workspaceNavItems } from "@/widgets/workspace-shell/config/navigation";
import { countByStatus, getCompletion, taskKey } from "@/widgets/workspace-shell/lib/task-utils";
import { useWorkspaceData } from "@/widgets/workspace-shell/model/use-workspace-data";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";
import { useUiStore } from "@/store/use-ui-store";
import { statusLabels, statusOrder, statusTone } from "@/lib/task-meta";

export type { TaskScope, WorkspaceData } from "@/widgets/workspace-shell/model/types";
export { filterTasksByScope } from "@/widgets/workspace-shell/lib/task-utils";

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

type SidebarPanel = "home" | "tasks" | "boards" | "analytics" | "projects" | "notifications" | "help" | "settings";

function getPanelByPath(pathname: string): SidebarPanel {
  if (pathname.startsWith("/boards")) {
    return "boards";
  }

  if (pathname.startsWith("/tasks")) {
    return "tasks";
  }

  if (pathname.startsWith("/analytics")) {
    return "analytics";
  }

  return "home";
}

function getPanelByRoute(href: Route): SidebarPanel {
  if (href === "/boards") {
    return "boards";
  }

  if (href === "/tasks") {
    return "tasks";
  }

  if (href === "/analytics") {
    return "analytics";
  }

  return "home";
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
              "group w-full rounded-xl px-3 py-2.5 text-left text-sm transition",
              active ? "bg-[#111827] text-white" : "text-text/64 hover:bg-black/[0.04] hover:text-text",
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
  const [activePanel, setActivePanel] = useState<SidebarPanel>(() => getPanelByPath(pathname));
  const clearSession = useUiStore((state) => state.clearSession);
  const setSelectedOrganizationId = useUiStore((state) => state.setSelectedOrganizationId);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  const openRoutePanel = (href: Route, panel: SidebarPanel): void => {
    router.push(href);
    setActivePanel(panel);
  };

  const selectProject = (projectId: string): void => {
    setSelectedProjectId(projectId);
    router.push("/tasks");
  };

  const railItems = [
    ...workspaceNavItems.map((item) => ({
      id: item.href,
      label: item.label,
      icon: item.icon,
      active: item.match(pathname) || activePanel === getPanelByRoute(item.href),
      onClick: () => openRoutePanel(item.href, getPanelByRoute(item.href)),
    })),
    {
      id: "projects",
      label: "Проекты",
      icon: ProjectsIcon,
      active: activePanel === "projects",
      onClick: () => setActivePanel("projects"),
    },
  ];

  const utilityItems = [
    { id: "notifications", label: "Уведомления", icon: BellIcon, active: activePanel === "notifications", onClick: () => setActivePanel("notifications") },
    { id: "help", label: "Помощь", icon: HelpIcon, active: activePanel === "help", onClick: () => setActivePanel("help") },
    { id: "settings", label: "Настройки", icon: SettingsIcon, active: activePanel === "settings", onClick: () => setActivePanel("settings") },
  ];

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center overflow-hidden border-r border-black/[0.08] bg-[#eef1f3] py-4 lg:flex">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f97316]">
          <span className="h-5 w-5 rounded-full border-[5px] border-white" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
          {railItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={item.onClick}
                className={clsx(
                  "grid h-11 w-11 place-items-center rounded-2xl transition",
                  item.active ? "bg-[#3f7cf4] text-white shadow-[0_10px_24px_rgba(63,124,244,0.25)]" : "text-[#2f333b] hover:bg-white hover:text-[#111827]",
                )}
              >
                <Icon size={21} />
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2">
          {utilityItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                title={item.label}
                aria-label={item.label}
                onClick={item.onClick}
                className={clsx(
                  "grid h-10 w-10 place-items-center rounded-2xl transition",
                  item.active ? "bg-[#111827] text-white" : "text-[#2f333b] hover:bg-white hover:text-[#111827]",
                )}
              >
                <Icon size={20} />
              </button>
            );
          })}
          <button
            type="button"
            title={data.userName}
            aria-label={data.userName}
            onClick={() => setActivePanel("settings")}
            className="mt-2 grid h-11 w-11 place-items-center rounded-full border border-white bg-[#111827] text-white shadow-sm"
          >
            <UserIcon size={19} />
          </button>
        </div>
      </aside>

      <aside className="sticky top-0 hidden h-screen w-[360px] shrink-0 overflow-hidden border-r border-black/[0.08] bg-white px-6 py-7 lg:block">
        {activePanel === "home" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Главная</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Сводка проекта</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text/48">{data.activeProject?.name ?? "Проект не выбран"}</span>
                <span className="font-semibold text-text">{getCompletion(data.tasks)}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.08]">
                <div className="h-full rounded-full bg-[#111827]" style={{ width: `${getCompletion(data.tasks)}%` }} />
              </div>
              <p className="mt-4 text-sm leading-6 text-text/56">Всего задач: {data.tasks.length}. В работе: {countByStatus(data.tasks, "IN_PROGRESS")}.</p>
            </div>
          </div>
        ) : null}

        {activePanel === "tasks" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Задачи</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Мои задачи</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {data.tasks.filter((task) => task.assignee?.id === data.userId || task.creator.id === data.userId).slice(0, 8).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-3 transition hover:bg-black/[0.025]">
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-text/36">{taskKey(task)}</span>
                    <Badge tone={statusTone[task.status]}>{statusLabels[task.status]}</Badge>
                  </div>
                </Link>
              ))}
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => router.push("/tasks")}>
              Открыть список
            </Button>
          </div>
        ) : null}

        {activePanel === "boards" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Доски</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Статусы</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {statusOrder.map((status) => (
                <button key={status} type="button" className="flex w-full items-center justify-between gap-3 py-3 text-left" onClick={() => router.push("/boards")}>
                  <Badge tone={statusTone[status]}>{statusLabels[status]}</Badge>
                  <span className="text-sm font-semibold text-text">{countByStatus(data.tasks, status)}</span>
                </button>
              ))}
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => router.push("/boards")}>
              Открыть доску
            </Button>
          </div>
        ) : null}

        {activePanel === "analytics" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Аналитика</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Прогресс</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5">
              <p className="text-6xl font-semibold tracking-[-0.06em] text-text">{getCompletion(data.tasks)}%</p>
              <p className="mt-3 text-sm leading-6 text-text/56">Готовность по текущей выборке задач проекта.</p>
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => router.push("/analytics")}>
              Открыть аналитику
            </Button>
          </div>
        ) : null}

        {activePanel === "projects" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Проекты</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Выбор проекта</h2>
            <p className="mt-2 text-sm leading-6 text-text/52">Выберите проект, чтобы открыть список задач по нему.</p>
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

        {activePanel === "notifications" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Уведомления</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">События</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5 text-sm leading-6 text-text/56">
              Новых уведомлений нет. Изменения задач приходят через realtime и сразу обновляют текущие экраны.
            </div>
            <div className="mt-5 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {data.tasks.slice(0, 4).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-3 transition hover:bg-black/[0.025]">
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <p className="mt-1 text-xs text-text/42">Обновлено {formatRelativeDate(task.updatedAt)}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {activePanel === "help" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Помощь</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Быстрые подсказки</h2>
            <div className="mt-6 space-y-4 text-sm leading-6 text-text/58">
              <p>Доски меняют статус задачи drag-and-drop.</p>
              <p>Список задач удобен для triage и поиска.</p>
              <p>Карточка задачи открывается отдельной страницей и сохраняет ссылку.</p>
            </div>
          </div>
        ) : null}

        {activePanel === "settings" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Настройки</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Профиль</h2>
            <div className="mt-6 flex items-center gap-3 border-y border-black/[0.08] py-5">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#111827] text-xs font-black text-white">{getInitials(data.userName)}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{data.userName}</p>
                <p className="truncate text-xs text-text/42">{data.userEmail}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs uppercase tracking-[0.18em] text-text/36">Организация</p>
              <Select
                value={data.activeOrganizationId ?? ""}
                onChange={(event) => setSelectedOrganizationId(event.target.value)}
                className="rounded-xl border-black/[0.12] bg-transparent py-2.5 text-sm"
              >
                {data.organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <ThemeToggle />
              <Button type="button" variant="ghost" className="flex-1 rounded-xl px-3" onClick={clearSession}>
                Выйти
              </Button>
            </div>
          </div>
        ) : null}
      </aside>

      <div className="border-b border-black/[0.08] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f97316]">
            <span className="h-4 w-4 rounded-full border-4 border-white" />
          </span>
          <div className="flex items-center gap-1">
            {workspaceNavItems.map((item) => {
              const Icon = item.icon;
              const active = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className={clsx("grid h-9 w-9 place-items-center rounded-xl", active ? "bg-[#3f7cf4] text-white" : "text-text/54")}
                >
                  <Icon size={18} />
                </Link>
              );
            })}
          </div>
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
  return (
    <header className="border-b border-black/[0.08] pb-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-text/40">{data.activeProject?.key ?? "WORKSPACE"}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.055em] text-text md:text-6xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-text/60">{description}</p>
        </div>
        <div className="min-w-[240px]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text/48">{data.activeProject?.name ?? "Проект не выбран"}</span>
            <span className="font-semibold text-text">{getCompletion(data.tasks)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.08]">
            <div className="h-full rounded-full bg-[#111827]" style={{ width: `${getCompletion(data.tasks)}%` }} />
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
      <main className="min-h-screen bg-[#f6f4ee] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  if (!accessToken || !user) {
    return <SignInForm />;
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] p-5">
        <SkeletonBoard />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] text-text">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <WorkspaceSidebar data={data} />
        <section className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:px-10">
          <div className="mx-auto max-w-[1480px] space-y-8">
            <WorkspaceHeader title={title} description={description} data={data} />
            {data.projects.length === 0 ? (
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
