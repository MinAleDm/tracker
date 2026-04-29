import type { OrganizationDto, ProjectDto, TaskDto, UserSummaryDto } from "@tracker/types";

export type TaskScope = "all" | "mine" | "unassigned" | "review";

export type WorkspaceData = {
  activeOrganizationId: string | null;
  activeProject: ProjectDto | null;
  isLoadingTasks: boolean;
  members: UserSummaryDto[];
  organizations: OrganizationDto[];
  projects: ProjectDto[];
  selectedProjectId: string | null;
  tasks: TaskDto[];
  userId: string;
  userEmail: string;
  userName: string;
};
