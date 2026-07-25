"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  ActivityIcon,
  BoardIcon,
  DashboardIcon,
  ListIcon,
  PlusIcon,
  QueueIcon,
  SearchIcon,
  UserIcon,
} from "@/shared/ui/tracker-icons";
import { useUiStore } from "@/store/use-ui-store";

const COMMAND_MENU_EVENT = "tracker:open-command-menu";

export function openWorkspaceCommandMenu() {
  window.dispatchEvent(new Event(COMMAND_MENU_EVENT));
}

export function WorkspaceCommandMenu({
  hasProject,
  userId,
}: {
  hasProject: boolean;
  userId: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const requestTaskCreate = useUiStore((state) => state.requestTaskCreate);
  const applyTaskView = useUiStore((state) => state.applyTaskView);

  const navigate = useCallback((href: Route) => {
    setOpen(false);
    router.push(href);
  }, [router]);

  const commands = useMemo(
    () => [
      {
        id: "create",
        label: "Создать задачу",
        description: "Открыть быстрый composer",
        keywords: "new create добавить новая",
        icon: PlusIcon,
        disabled: !hasProject,
        run: () => {
          requestTaskCreate();
          navigate("/tasks");
        },
      },
      {
        id: "overview",
        label: "Открыть главную",
        description: "Сводка и фокус проекта",
        keywords: "home dashboard обзор главная",
        icon: DashboardIcon,
        disabled: false,
        run: () => navigate("/"),
      },
      {
        id: "tasks",
        label: "Открыть все задачи",
        description: "Список задач проекта",
        keywords: "issues list задачи список",
        icon: ListIcon,
        disabled: false,
        run: () => navigate("/tasks"),
      },
      {
        id: "mine",
        label: "Открыть мою очередь",
        description: "Только назначенные мне задачи",
        keywords: "mine assigned мои очередь",
        icon: UserIcon,
        disabled: false,
        run: () => {
          applyTaskView({ search: "", status: "ALL", priority: "ALL", assigneeId: userId });
          navigate("/tasks");
        },
      },
      {
        id: "triage",
        label: "Открыть triage",
        description: "Новые задачи без исполнителя",
        keywords: "triage unassigned входящие без исполнителя",
        icon: QueueIcon,
        disabled: false,
        run: () => {
          applyTaskView({ search: "", status: "TODO", priority: "ALL", assigneeId: "unassigned" });
          navigate("/tasks");
        },
      },
      {
        id: "board",
        label: "Открыть доску",
        description: "Kanban по статусам",
        keywords: "board kanban доска",
        icon: BoardIcon,
        disabled: false,
        run: () => navigate("/boards"),
      },
      {
        id: "analytics",
        label: "Открыть аналитику",
        description: "Метрики потока и команды",
        keywords: "analytics reports аналитика отчеты",
        icon: ActivityIcon,
        disabled: false,
        run: () => navigate("/analytics"),
      },
    ],
    [applyTaskView, hasProject, navigate, requestTaskCreate, userId],
  );

  const filteredCommands = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    if (!normalizedQuery) return commands;

    return commands.filter((command) =>
      `${command.label} ${command.description} ${command.keywords}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery),
    );
  }, [commands, query]);

  useEffect(() => {
    const handleGlobalKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const handleOpen = () => setOpen(true);

    window.addEventListener("keydown", handleGlobalKey);
    window.addEventListener(COMMAND_MENU_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleGlobalKey);
      window.removeEventListener(COMMAND_MENU_EVENT, handleOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!open) return null;

  const runCommand = (index: number) => {
    const command = filteredCommands[index];
    if (!command || command.disabled) return;
    command.run();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-[#171a1f]/38 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) setOpen(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Командное меню"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_80px_rgba(16,24,40,0.24)]"
      >
        <label className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon size={19} className="text-text/38" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="workspace-command-list"
            aria-activedescendant={filteredCommands[activeIndex] ? `workspace-command-${filteredCommands[activeIndex].id}` : undefined}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setOpen(false);
              }
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((value) => Math.min(value + 1, filteredCommands.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((value) => Math.max(value - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                runCommand(activeIndex);
              }
            }}
            placeholder="Найти действие или раздел…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text/36"
          />
          <kbd className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-[10px] text-text/42">Esc</kbd>
        </label>

        <div id="workspace-command-list" role="listbox" className="max-h-[420px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-text/48">Действий по этому запросу не найдено.</p>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              const active = index === activeIndex;

              return (
                <button
                  key={command.id}
                  id={`workspace-command-${command.id}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={command.disabled}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(index)}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition",
                    active ? "bg-accent/10" : "hover:bg-muted",
                    command.disabled && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className={clsx("grid h-9 w-9 place-items-center rounded-lg", active ? "bg-white text-accent" : "bg-muted text-text/48")}>
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{command.label}</span>
                    <span className="mt-0.5 block text-xs text-text/46">{command.description}</span>
                  </span>
                  {command.id === "create" ? <kbd className="ml-auto font-mono text-[10px] text-text/36">C</kbd> : null}
                </button>
              );
            })
          )}
        </div>

        <footer className="flex items-center gap-4 border-t border-border bg-muted/55 px-4 py-2 text-[11px] text-text/40">
          <span>↑↓ выбрать</span>
          <span>↵ открыть</span>
          <span>Esc закрыть</span>
        </footer>
      </section>
    </div>
  );
}
