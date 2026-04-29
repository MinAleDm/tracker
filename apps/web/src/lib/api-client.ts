"use client";

import type {
  AuthSessionDto,
  OrganizationDto,
  ProjectDto,
  TaskDetailsDto,
  TaskListResponseDto,
  UserSummaryDto,
} from "@tracker/types";
import { useUiStore } from "@/store/use-ui-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function refreshTokens() {
  const store = useUiStore.getState();

  if (!store.refreshToken) {
    store.clearSession();
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: store.refreshToken }),
  });

  if (!response.ok) {
    store.clearSession();
    return null;
  }

  const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
  store.updateTokens(tokens);
  return tokens.accessToken;
}

async function request<T>(path: string, init?: RequestInit, shouldRetry = true): Promise<T> {
  const store = useUiStore.getState();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");

  if (store.accessToken) {
    headers.set("Authorization", `Bearer ${store.accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  // При протухшем access token один раз обновляем пару токенов и повторяем исходный запрос.
  if (response.status === 401 && shouldRetry) {
    const token = await refreshTokens();

    if (token) {
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    const body = (await response.text()) || "Request failed";
    throw new ApiError(body, response.status);
  }

  return (await response.json()) as T;
}

export const apiClient = {
  async login(email: string, password: string) {
    return request<AuthSessionDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  async getOrganizations() {
    return request<OrganizationDto[]>("/organizations");
  },
  async getProjects(organizationId: string) {
    return request<ProjectDto[]>(`/projects?organizationId=${organizationId}`);
  },
  async createProject(input: { organizationId: string; key: string; name: string; description?: string }) {
    return request<ProjectDto>("/projects", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async getUsers(organizationId: string) {
    return request<UserSummaryDto[]>(`/users?organizationId=${organizationId}`);
  },
  async getTasks(projectId: string, params: URLSearchParams) {
    return request<TaskListResponseDto>(`/projects/${projectId}/tasks?${params.toString()}`);
  },
  async getTask(taskId: string) {
    return request<TaskDetailsDto>(`/tasks/${taskId}`);
  },
  async createTask(projectId: string, input: Record<string, unknown>) {
    return request(`/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async updateTask(taskId: string, input: Record<string, unknown>) {
    return request<TaskDetailsDto>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  async createComment(taskId: string, body: string) {
    return request(`/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },
};
