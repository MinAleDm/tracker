export type UserRole = "ADMIN" | "USER";
export type OrganizationRole = "OWNER" | "ADMIN" | "MEMBER";
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface PaginationMetaDto {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AuthTokensDto {
  accessToken: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthSessionDto {
  user: AuthUserDto;
  organizations: OrganizationDto[];
  tokens: AuthTokensDto;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface OrganizationDto {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole;
}

export interface ProjectDto {
  id: string;
  organizationId: string;
  key: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface UserSummaryDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface TaskCommentDto {
  id: string;
  body: string;
  author: UserSummaryDto;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivityDto {
  id: string;
  action: string;
  field: string | null;
  beforeValue: string | null;
  afterValue: string | null;
  actor: UserSummaryDto;
  createdAt: string;
}

export interface TaskDto {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: UserSummaryDto | null;
  creator: UserSummaryDto;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetailsDto extends TaskDto {
  comments: TaskCommentDto[];
  activity: TaskActivityDto[];
}

export interface TaskListResponseDto {
  data: TaskDto[];
  meta: PaginationMetaDto;
}

export interface TaskFiltersDto {
  projectId: string;
  search?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateProjectDto {
  organizationId: string;
  key: string;
  name: string;
  description?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
}

export interface CreateCommentDto {
  body: string;
}

export interface RealtimeTaskEventDto {
  projectId: string;
  taskId: string;
  action: "created" | "updated" | "commented";
}
