import type { OrganizationDto, ProjectDto, TaskDto, UserSummaryDto } from "@tracker/types";

export type WorkspaceData = {
  activeOrganizationId: string | null;
  activeProject: ProjectDto | null;
  isLoadingWorkspace: boolean;
  isLoadingTasks: boolean;
  members: UserSummaryDto[];
  organizations: OrganizationDto[];
  projects: ProjectDto[];
  selectedProjectId: string | null;
  tasks: TaskDto[];
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  organizationRole: string | null;
  workspaceError: boolean;
  retryWorkspace: () => void;
};
