"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserDto, TaskPriority, TaskStatus } from "@tracker/types";

interface UiState {
  hydrated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUserDto | null;
  selectedOrganizationId: string | null;
  selectedProjectId: string | null;
  search: string;
  status: TaskStatus | "ALL";
  priority: TaskPriority | "ALL";
  assigneeId: string | "ALL";
  setHydrated: (value: boolean) => void;
  setSession: (input: { accessToken: string; refreshToken: string; user: AuthUserDto }) => void;
  updateTokens: (input: { accessToken: string; refreshToken: string }) => void;
  clearSession: () => void;
  setSelectedOrganizationId: (value: string | null) => void;
  setSelectedProjectId: (value: string | null) => void;
  setSearch: (value: string) => void;
  setStatus: (value: TaskStatus | "ALL") => void;
  setPriority: (value: TaskPriority | "ALL") => void;
  setAssigneeId: (value: string | "ALL") => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hydrated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
      selectedOrganizationId: null,
      selectedProjectId: null,
      search: "",
      status: "ALL",
      priority: "ALL",
      assigneeId: "ALL",
      setHydrated: (hydrated) => set({ hydrated }),
      setSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken,
          user,
        }),
      updateTokens: ({ accessToken, refreshToken }) =>
        set({
          accessToken,
          refreshToken,
        }),
      clearSession: () =>
        set({
          accessToken: null,
          refreshToken: null,
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
    }),
    {
      name: "tracker-web-ui",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        selectedOrganizationId: state.selectedOrganizationId,
        selectedProjectId: state.selectedProjectId,
        search: state.search,
        status: state.status,
        priority: state.priority,
        assigneeId: state.assigneeId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
