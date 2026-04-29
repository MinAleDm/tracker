"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import type { ProjectDto } from "@tracker/types";
import { Button, Select } from "@tracker/ui";
import clsx from "clsx";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { ThemeToggle } from "@/features/theme-toggle/ui/theme-toggle";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import { workspaceNavItems } from "@/widgets/workspace-shell/config/navigation";
import { getCompletion } from "@/widgets/workspace-shell/lib/task-utils";
import { useWorkspaceData } from "@/widgets/workspace-shell/model/use-workspace-data";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";
import { useUiStore } from "@/store/use-ui-store";

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
    return compact ? null : <p className="text-sm leading-6 text-white/52">Создайте первый проект ниже.</p>;
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
            title={compact ? project.name : undefined}
            className={clsx(
              "group w-full text-left text-sm transition",
              compact ? "grid h-10 place-items-center rounded-xl" : "rounded-xl px-3 py-2.5",
              active ? "bg-white text-[#111827]" : "text-white/64 hover:bg-white/10 hover:text-white",
            )}
          >
            {compact ? (
              <span className="text-xs font-black uppercase tracking-[-0.08em]">{project.key.slice(0, 2)}</span>
            ) : (
              <span className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-semibold">{project.name}</span>
                <span className={clsx("text-xs", active ? "text-[#687083]" : "text-white/36")}>{project.key}</span>
              </span>
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
        "border-r border-black/[0.08] bg-[#111827] p-3 text-white transition-all duration-300 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto",
        collapsed ? "lg:w-[76px]" : "lg:w-[284px]",
      )}
    >
      <div className={clsx("flex items-center gap-3", collapsed ? "justify-center" : "justify-between")}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f97316] text-sm font-black tracking-[-0.08em]">TR</div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Tracker Pro</p>
              <p className="text-xs text-white/42">Workspace</p>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black text-white/62 transition hover:bg-white/10 hover:text-white lg:grid"
          aria-label={collapsed ? "Открыть сайдбар" : "Свернуть сайдбар"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className="mt-3 grid h-10 w-full place-items-center rounded-xl bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 lg:hidden"
      >
        {collapsed ? "Открыть меню" : "Свернуть меню"}
      </button>

      {!collapsed ? (
        <div className="mt-6">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/32">Организация</p>
          <Select
            value={data.activeOrganizationId ?? ""}
            onChange={(event) => setSelectedOrganizationId(event.target.value)}
            className="rounded-xl border-white/10 bg-white/10 py-2.5 text-sm text-white [color-scheme:dark]"
          >
            {data.organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <nav className="mt-6 space-y-1">
        {workspaceNavItems.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "flex items-center gap-3 rounded-xl text-sm transition",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                active ? "bg-white text-[#111827]" : "text-white/62 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon size={18} />
              {!collapsed ? (
                <span className="min-w-0">
                  <span className="block font-semibold">{item.label}</span>
                  <span className={clsx("mt-0.5 block text-xs", active ? "text-[#687083]" : "text-white/36")}>{item.description}</span>
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6">
        {!collapsed ? <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/32">Проекты</p> : null}
        <ProjectSwitcher projects={data.projects} selectedProjectId={data.selectedProjectId} compact={collapsed} onSelect={setSelectedProjectId} />
      </div>

      {!collapsed && data.activeOrganizationId ? (
        <div className="mt-4">
          <ProjectCreate organizationId={data.activeOrganizationId} />
        </div>
      ) : null}

      <div className={clsx("mt-6 border-t border-white/10 pt-4", collapsed ? "text-center" : "")}>
        <div className={clsx("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-xs font-black text-[#111827]">
            {getInitials(data.userName)}
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{data.userName}</p>
              <p className="truncate text-xs text-white/40">{data.userEmail}</p>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <div className="mt-3 flex items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="ghost" className="flex-1 rounded-xl px-3 text-white hover:bg-white/10" onClick={clearSession}>
              Выйти
            </Button>
          </div>
        ) : null}
      </div>
    </aside>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <WorkspaceSidebar data={data} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
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
