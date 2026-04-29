"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useTaskRealtime } from "@/lib/use-task-realtime";
import { useUiStore } from "@/store/use-ui-store";
import type { WorkspaceData } from "@/widgets/workspace-shell/model/types";

export function useWorkspaceData(): WorkspaceData | null {
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
    userRole: user.role,
    organizationRole: organizationsQuery.data?.find((organization) => organization.id === activeOrganizationId)?.role ?? null,
  };
}
