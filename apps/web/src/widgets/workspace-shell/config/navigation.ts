import type { Route } from "next";
import { ActivityIcon, BoardIcon, DashboardIcon, ListIcon } from "@/shared/ui/tracker-icons";

export type WorkspaceNavItem = {
  href: Route;
  label: string;
  description: string;
  icon: typeof BoardIcon;
  match: (pathname: string) => boolean;
};

export const workspaceNavItems: WorkspaceNavItem[] = [
  {
    href: "/",
    label: "Главная",
    description: "Фокус и быстрый старт",
    icon: DashboardIcon,
    match: (pathname) => pathname === "/",
  },
  {
    href: "/boards",
    label: "Доски",
    description: "Kanban workflow",
    icon: BoardIcon,
    match: (pathname) => pathname.startsWith("/boards"),
  },
  {
    href: "/tasks",
    label: "Задачи",
    description: "Список и карточки",
    icon: ListIcon,
    match: (pathname) => pathname.startsWith("/tasks"),
  },
  {
    href: "/analytics",
    label: "Аналитика",
    description: "Метрики проекта",
    icon: ActivityIcon,
    match: (pathname) => pathname.startsWith("/analytics"),
  },
];
