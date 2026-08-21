"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserDto, TaskPriority, TaskStatus } from "@tracker/types";

export interface SavedTaskView {
  id: string;
  name: string;
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  assigneeId: string | "ALL";
  createdAt: string;
}

interface UiState {
  hydrated: boolean;
  authReady: boolean;
  accessToken: string | null;
  user: AuthUserDto | null;
  selectedOrganizationId: string | null;
  selectedProjectId: string | null;
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  assigneeId: string | "ALL";
  savedTaskViews: SavedTaskView[];
  createTaskSignal: number;
  setHydrated: (value: boolean) => void;
  setSession: (input: { accessToken: string; user: AuthUserDto }) => void;
  updateAccessToken: (accessToken: string) => void;
  completeAuthBootstrap: () => void;
  clearSession: () => void;
  setSelectedOrganizationId: (value: string | null) => void;
  setSelectedProjectId: (value: string | null) => void;
  setSearch: (value: string) => void;
  setStatus: (value: TaskStatus | "ALL") => void;
  setPriority: (value: TaskPriority | "ALL") => void;
  setAssigneeId: (value: string | "ALL") => void;
  saveCurrentTaskView: (name: string) => void;
  applyTaskView: (view: Pick<SavedTaskView, "search" | "status" | "priority" | "assigneeId">) => void;
  deleteTaskView: (id: string) => void;
  requestTaskCreate: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hydrated: false,
      authReady: false,
      accessToken: null,
      user: null,
      selectedOrganizationId: null,
      selectedProjectId: null,
      search: "",
      status: "ALL",
      priority: "ALL",
      assigneeId: "ALL",
      savedTaskViews: [],
      createTaskSignal: 0,
      setHydrated: (hydrated) => set({ hydrated }),
      setSession: ({ accessToken, user }) =>
        set({
          accessToken,
          user,
          authReady: true,
        }),
      updateAccessToken: (accessToken) => set({ accessToken }),
      completeAuthBootstrap: () => set({ authReady: true }),
      clearSession: () =>
        set({
          accessToken: null,
          user: null,
          selectedOrganizationId: null,
          selectedProjectId: null,
        }),
      setSelectedOrganizationId: (selectedOrganizationId) =>
        set({
          selectedOrganizationId,
          selectedProjectId: null,
        }),
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setSearch: (search) => set({ search }),
      setStatus: (status) => set({ status }),
      setPriority: (priority) => set({ priority }),
      setAssigneeId: (assigneeId) => set({ assigneeId }),
      saveCurrentTaskView: (name) =>
        set((state) => ({
          savedTaskViews: [
            {
              id: `view-${Math.random().toString(36).slice(2, 10)}`,
              name: name.trim(),
              search: state.search,
              status: state.status,
              priority: state.priority,
              assigneeId: state.assigneeId,
              createdAt: new Date().toISOString(),
            },
            ...state.savedTaskViews,
          ],
        })),
      applyTaskView: (view) =>
        set({
          search: view.search,
          status: view.status,
          priority: view.priority,
          assigneeId: view.assigneeId,
        }),
      deleteTaskView: (id) =>
        set((state) => ({
          savedTaskViews: state.savedTaskViews.filter((view) => view.id !== id),
        })),
      requestTaskCreate: () =>
        set((state) => ({
          createTaskSignal: state.createTaskSignal + 1,
        })),
    }),
    {
      name: "tracker-web-ui",
      version: 2,
      migrate: (persistedState) => {
        const safeState = { ...(persistedState as Record<string, unknown>) };
        delete safeState.accessToken;
        delete safeState.refreshToken;
        delete safeState.user;
        delete safeState.authReady;
        return safeState;
      },
      partialize: (state) => ({
        selectedOrganizationId: state.selectedOrganizationId,
        selectedProjectId: state.selectedProjectId,
        search: state.search,
        status: state.status,
        priority: state.priority,
        assigneeId: state.assigneeId,
        savedTaskViews: state.savedTaskViews,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
