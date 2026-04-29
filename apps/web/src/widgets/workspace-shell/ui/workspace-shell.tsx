"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectDto } from "@tracker/types";
import { Badge, Button } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { formatRelativeDate } from "@/shared/lib/utils/date";
import {
  ActivityIcon,
  BoardIcon,
  GoalIcon,
  HistoryIcon,
  ListIcon,
  PlusIcon,
  ProjectsIcon,
  QueueIcon,
  UserIcon,
} from "@/shared/ui/tracker-icons";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
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

type SidebarPanel = "tasks" | "projects" | "goals" | "queues" | "boards" | "dashboards" | "history";

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
  const [activePanel, setActivePanel] = useState<SidebarPanel | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const queryClient = useQueryClient();
  const clearSession = useUiStore((state) => state.clearSession);
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  const navigateTo = (href: Route): void => {
    router.push(href);
    setActivePanel(null);
  };

  const selectProject = (projectId: string): void => {
    setSelectedProjectId(projectId);
    router.push("/tasks");
    setActivePanel(null);
  };

  const createTaskMutation = useMutation({
    mutationFn: () => {
      if (!data.selectedProjectId) {
        throw new Error("Project is not selected");
      }

      return apiClient.createTask(data.selectedProjectId, {
        title: `Новая задача ${new Date().toLocaleString("ru-RU")}`,
        description: "Создано через кнопку быстрого создания в сайдбаре.",
        priority: "MEDIUM",
      });
    },
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", task.projectId] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.task(task.id) });
      router.push(`/tasks/${task.id}` as Route);
      setActivePanel(null);
    },
    onError: () => {
      setActivePanel("projects");
    },
  });

  const railItems = [
    {
      id: "tasks",
      label: "Задачи",
      icon: ListIcon,
      active: pathname.startsWith("/tasks") || activePanel === "tasks",
      onClick: () => setActivePanel("tasks"),
    },
    {
      id: "projects",
      label: "Проекты и портфели",
      icon: ProjectsIcon,
      active: activePanel === "projects",
      onClick: () => setActivePanel("projects"),
    },
    {
      id: "goals",
      label: "Цели",
      icon: GoalIcon,
      active: activePanel === "goals",
      onClick: () => setActivePanel("goals"),
    },
    {
      id: "queues",
      label: "Очереди",
      icon: QueueIcon,
      active: activePanel === "queues",
      onClick: () => setActivePanel("queues"),
    },
    {
      id: "boards",
      label: "Доски задач",
      icon: BoardIcon,
      active: pathname.startsWith("/boards") || activePanel === "boards",
      onClick: () => setActivePanel("boards"),
    },
    {
      id: "dashboards",
      label: "Дашборды и отчёты",
      icon: ActivityIcon,
      active: pathname.startsWith("/analytics") || activePanel === "dashboards",
      onClick: () => setActivePanel("dashboards"),
    },
    {
      id: "history",
      label: "История",
      icon: HistoryIcon,
      active: activePanel === "history",
      onClick: () => setActivePanel("history"),
    },
  ];

  const teamRole = roleLabels[data.organizationRole ?? data.userRole] ?? data.organizationRole ?? data.userRole;

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center overflow-hidden border-r border-black/[0.08] bg-[#eef1f3] py-4 lg:flex">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#f97316]">
          <span className="h-5 w-5 rounded-full border-[5px] border-white" />
        </div>

        <button
          type="button"
          title="Создать задачу"
          aria-label="Создать задачу"
          disabled={createTaskMutation.isPending}
          onClick={() => {
            if (!data.selectedProjectId) {
              setActivePanel("projects");
              return;
            }

            createTaskMutation.mutate();
          }}
          className="mt-7 grid h-11 w-11 place-items-center rounded-2xl bg-[#111827] text-white transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon size={22} />
        </button>

        <nav className="mt-4 flex flex-1 flex-col items-center gap-2">
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

        <div className="relative flex flex-col items-center gap-2">
          <button
            type="button"
            title={data.userName}
            aria-label={data.userName}
            onClick={() => setProfileOpen((value) => !value)}
            className={clsx(
              "mt-2 grid h-11 w-11 place-items-center rounded-full border border-white bg-[#111827] text-white shadow-sm transition",
              profileOpen ? "ring-2 ring-[#3f7cf4]/40" : "hover:bg-[#020617]",
            )}
          >
            <UserIcon size={19} />
          </button>

          {profileOpen ? (
            <div className="absolute bottom-0 left-[58px] z-50 w-[320px] rounded-3xl border border-black/[0.08] bg-white p-4 text-text shadow-[0_22px_70px_rgba(15,23,42,0.20)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{data.userName}</p>
                  <p className="mt-1 truncate text-xs text-text/44">{data.userEmail}</p>
                  <p className="mt-2 text-xs font-semibold text-text/56">Роль в команде: {teamRole}</p>
                </div>
                <Button type="button" variant="ghost" className="rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-50" onClick={clearSession}>
                  Выйти
                </Button>
              </div>
              <button
                type="button"
                className="mt-4 w-full rounded-2xl border border-black/[0.08] px-4 py-3 text-left text-sm font-semibold text-text transition hover:bg-black/[0.035]"
                onClick={clearSession}
              >
                Добавить пользователя
                <span className="mt-1 block text-xs font-normal text-text/44">Выйти на экран входа и авторизоваться ещё раз.</span>
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {activePanel ? (
        <div className="fixed inset-y-0 left-[72px] right-0 z-40 hidden lg:block">
          <button
            type="button"
            aria-label="Закрыть панель"
            className="absolute inset-0 cursor-default bg-[#111827]/38 backdrop-blur-[1px]"
            onClick={() => setActivePanel(null)}
          />
          <aside className="relative h-screen w-[420px] overflow-hidden bg-white px-6 py-7 shadow-[26px_0_70px_rgba(15,23,42,0.22)]">
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Задачи</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Мои задачи</h2>
            <div className="mt-6 divide-y divide-black/[0.08] border-y border-black/[0.08]">
              {data.tasks.filter((task) => task.assignee?.id === data.userId || task.creator.id === data.userId).slice(0, 8).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}` as Route} className="block py-3 transition hover:bg-black/[0.025]" onClick={() => setActivePanel(null)}>
                  <p className="line-clamp-1 text-sm font-semibold text-text">{task.title}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-[0.14em] text-text/36">{taskKey(task)}</span>
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Доски</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Статусы</h2>
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Проекты и портфели</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Выбор проекта</h2>
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Цели</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Цели команды</h2>
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Очереди</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Рабочие очереди</h2>
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
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">Дашборд и отчёты</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Прогресс</h2>
            <div className="mt-6 border-y border-black/[0.08] py-5">
              <p className="text-6xl font-semibold tracking-[-0.06em] text-text">{getCompletion(data.tasks)}%</p>
              <p className="mt-3 text-sm leading-6 text-text/56">Готовность по текущей выборке задач проекта.</p>
            </div>
            <Button type="button" variant="primary" className="mt-5 w-full rounded-xl bg-[#111827] py-3 hover:bg-[#020617]" onClick={() => navigateTo("/analytics")}>
              Открыть отчёты
            </Button>
          </div>
        ) : null}

        {activePanel === "history" ? (
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-text/36">История</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">Последние изменения</h2>
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
          </aside>
        </div>
      ) : null}

      <div className="border-b border-black/[0.08] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f97316]">
            <span className="h-4 w-4 rounded-full border-4 border-white" />
          </span>
          <div className="flex items-center gap-1">
            {railItems.slice(0, 5).map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  onClick={item.onClick}
                  className={clsx("grid h-9 w-9 place-items-center rounded-xl", item.active ? "bg-[#3f7cf4] text-white" : "text-text/54")}
                >
                  <Icon size={18} />
                </button>
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
