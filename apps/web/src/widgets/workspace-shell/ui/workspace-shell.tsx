"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  Separator,
  cn,
} from "@tracker/ui";
import { ChevronRight, LogOut, Menu } from "lucide-react";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { ProjectCreate } from "@/features/project-create/ui/project-create";
import { ThemeToggle } from "@/features/theme-toggle/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";
import { SkeletonBoard } from "@/shared/ui/skeleton-board";
import {
  ActivityIcon,
  PlusIcon,
  ProjectsIcon,
  SearchIcon,
} from "@/shared/ui/tracker-icons";
import { getInitials } from "@/shared/lib/utils/string";
import { useUiStore } from "@/store/use-ui-store";
import { workspaceNavItems } from "@/widgets/workspace-shell/config/navigation";
import { useWorkspaceData } from "@/widgets/workspace-shell/model/use-workspace-data";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";
import { EmptyState } from "@/widgets/workspace-shell/ui/empty-state";
import { openWorkspaceCommandMenu, WorkspaceCommandMenu } from "@/widgets/workspace-shell/ui/workspace-command-menu";

export type { WorkspaceData } from "@/widgets/workspace-shell/model/types";

const roleLabels: Record<string, string> = {
  ADMIN: "Администратор",
  OWNER: "Владелец",
  USER: "Участник",
  MEMBER: "Участник",
};

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg px-2 py-1.5 focus-visible:ring-2 focus-visible:ring-ring">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <span className="size-3.5 rotate-45 rounded-[3px] border-2 border-current" />
      </span>
      <span>
        <span className="block text-sm font-semibold leading-4">Tracker</span>
        <span className="text-xs text-muted-foreground">Workspace</span>
      </span>
    </Link>
  );
}

function ProjectDialog({ data, open, onOpenChange }: { data: WorkspaceData; open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Проекты</DialogTitle>
          <DialogDescription>Смените рабочий контекст или создайте новый проект.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {data.projects.map((project) => {
            const active = project.id === data.selectedProjectId;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => {
                  setSelectedProjectId(project.id);
                  onOpenChange(false);
                  router.push("/tasks");
                }}
                className={cn("flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent", active && "border-primary bg-accent")}
              >
                <span className="grid size-9 place-items-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">{project.key.slice(0, 2)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{project.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{project.description || `Проект ${project.key}`}</span>
                </span>
                {active ? <Badge>Текущий</Badge> : <ChevronRight className="size-4 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
        {data.activeOrganizationId ? <><Separator /><ProjectCreate organizationId={data.activeOrganizationId} /></> : null}
      </DialogContent>
    </Dialog>
  );
}

function UserMenu({ data }: { data: WorkspaceData }) {
  const role = roleLabels[data.organizationRole ?? data.userRole] ?? data.organizationRole ?? data.userRole;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 px-2 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{getInitials(data.userName)}</span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-medium">{data.userName}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{role}</span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" className="w-64">
        <DropdownMenuLabel>
          <span className="block truncate">{data.userName}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{data.userEmail}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void apiClient.logout()}>
          <LogOut className="mr-2 size-4" /> Выйти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar({ data, onProjectsOpen }: { data: WorkspaceData; onProjectsOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const requestTaskCreate = useUiStore((state) => state.requestTaskCreate);

  const createTask = () => {
    if (!data.selectedProjectId) return onProjectsOpen();
    requestTaskCreate();
    router.push("/tasks");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key.toLowerCase() !== "c" || event.metaKey || event.ctrlKey || event.altKey || target?.matches("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      createTask();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/70 p-3 backdrop-blur lg:flex">
      <Brand />
      <Button className="mt-4 w-full justify-start gap-2" onClick={createTask}><PlusIcon size={16} />Новая задача<kbd className="ml-auto rounded border border-primary-foreground/20 px-1.5 text-[10px]">C</kbd></Button>
      <Button variant="outline" className="mt-2 w-full justify-start gap-2 text-muted-foreground" onClick={openWorkspaceCommandMenu}><SearchIcon size={16} />Поиск и команды<kbd className="ml-auto text-[10px]">⌘K</kbd></Button>

      <nav aria-label="Основная навигация" className="mt-6 space-y-1">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Навигация</p>
        {workspaceNavItems.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={cn("flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground", active && "bg-accent text-accent-foreground")}><Icon size={17} /><span>{item.label}</span></Link>;
        })}
      </nav>

      <div className="mt-6">
        <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Текущий проект</p>
        <button type="button" onClick={onProjectsOpen} className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left shadow-sm transition-colors hover:bg-accent">
          <span className="grid size-9 place-items-center rounded-md bg-primary/10 font-mono text-xs font-bold text-primary">{data.activeProject?.key.slice(0, 2) ?? "—"}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{data.activeProject?.name ?? "Выбрать проект"}</span><span className="block text-xs text-muted-foreground">{data.tasks.length} задач</span></span>
          <ProjectsIcon size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="mt-auto space-y-2"><Separator /><div className="flex items-center gap-1"><div className="min-w-0 flex-1"><UserMenu data={data} /></div><ThemeToggle /></div></div>
    </aside>
  );
}

function MobileHeader({ data, onProjectsOpen }: { data: WorkspaceData; onProjectsOpen: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const requestTaskCreate = useUiStore((state) => state.requestTaskCreate);
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3"><Brand /><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={openWorkspaceCommandMenu} aria-label="Поиск"><SearchIcon size={18} /></Button><Button size="icon" onClick={() => { if (!data.selectedProjectId) return onProjectsOpen(); requestTaskCreate(); router.push("/tasks"); }} aria-label="Создать задачу"><PlusIcon size={18} /></Button><Button size="icon" variant="outline" onClick={onProjectsOpen} aria-label="Проекты"><Menu size={18} /></Button></div></div>
      <nav className="mt-3 grid grid-cols-4 gap-1" aria-label="Мобильная навигация">{workspaceNavItems.map((item) => { const Icon = item.icon; const active = item.match(pathname); return <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-md px-1 py-2 text-[11px] text-muted-foreground", active && "bg-accent text-accent-foreground")}><Icon size={16} />{item.label}</Link>; })}</nav>
    </header>
  );
}

function WorkspaceHeader({ title, description, data }: { title: string; description: string; data: WorkspaceData }) {
  const setSelectedProjectId = useUiStore((state) => state.setSelectedProjectId);
  return (
    <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{data.organizations.find((item) => item.id === data.activeOrganizationId)?.name ?? "Workspace"}</span>
          <span>/</span>
          <span className="font-mono">{data.activeProject?.key ?? "PROJECT"}</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {data.projects.length ? (
        <Select aria-label="Текущий проект" value={data.selectedProjectId ?? ""} onChange={(event) => setSelectedProjectId(event.target.value || null)} className="w-full bg-card sm:w-72">
          {data.projects.map((project) => <option key={project.id} value={project.id}>{project.key} · {project.name}</option>)}
        </Select>
      ) : null}
    </header>
  );
}

export function WorkspacePage({ title, description, children }: { title: string; description: string; children: (data: WorkspaceData) => ReactNode }) {
  const hydrated = useUiStore((state) => state.hydrated);
  const authReady = useUiStore((state) => state.authReady);
  const accessToken = useUiStore((state) => state.accessToken);
  const user = useUiStore((state) => state.user);
  const data = useWorkspaceData();
  const [projectsOpen, setProjectsOpen] = useState(false);

  if (!hydrated || !authReady || (accessToken && user && !data)) return <main id="main-content" className="min-h-screen p-5"><SkeletonBoard /></main>;
  if (!accessToken || !user) return <SignInForm />;
  if (!data || data.isLoadingWorkspace) return <main id="main-content" className="min-h-screen p-5"><div className="mx-auto max-w-7xl"><SkeletonBoard /></div></main>;

  return (
    <main id="main-content" className="min-h-screen bg-background">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar data={data} onProjectsOpen={() => setProjectsOpen(true)} />
        <MobileHeader data={data} onProjectsOpen={() => setProjectsOpen(true)} />
        <ProjectDialog data={data} open={projectsOpen} onOpenChange={setProjectsOpen} />
        <WorkspaceCommandMenu hasProject={Boolean(data.selectedProjectId)} userId={data.userId} />
        <section className="min-w-0 flex-1 p-3 md:p-5 lg:p-6">
          <div className="mx-auto max-w-[1480px] space-y-5">
            <WorkspaceHeader title={title} description={description} data={data} />
            {data.workspaceError ? <Card className="px-6 py-12 text-center"><ActivityIcon className="mx-auto text-destructive" /><h2 className="mt-4 text-lg font-semibold">Не удалось загрузить рабочее пространство</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Проверьте соединение с API и повторите запрос.</p><Button className="mt-5" onClick={data.retryWorkspace}>Повторить</Button></Card> : data.projects.length === 0 ? <EmptyState title="Создайте проект" description="После создания здесь появятся задачи, доски и аналитика." action="Откройте меню проектов в боковой панели." /> : children(data)}
          </div>
        </section>
      </div>
    </main>
  );
}
