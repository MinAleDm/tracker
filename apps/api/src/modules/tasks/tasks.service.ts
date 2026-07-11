import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateTaskDto, TaskActivityDto, TaskDetailsDto, TaskFiltersDto, TaskListResponseDto, UpdateTaskDto } from "@tracker/types";
import type { OrganizationPermission } from "../../common/auth/organization-permissions";
import { OrganizationsService } from "../organizations/organizations.service";
import { RedisService } from "../../common/redis/redis.service";
import { ActivityRepository } from "./activity.repository";
import { CommentsRepository } from "./comments.repository";
import { TaskEventsService } from "./events/task-events.service";
import { mapActivity, mapComment, mapTask, mapTaskDetails } from "./task.mapper";
import { TasksRepository } from "./tasks.repository";

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly commentsRepository: CommentsRepository,
    private readonly activityRepository: ActivityRepository,
    private readonly redisService: RedisService,
    private readonly taskEventsService: TaskEventsService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async list(userId: string, filters: TaskFiltersDto): Promise<TaskListResponseDto> {
    const normalizedFilters = this.normalizeFilters(filters);
    const cacheKey = `tasks:${userId}:${normalizedFilters.projectId}:${JSON.stringify(normalizedFilters)}`;
    const cached = await this.redisService.get<TaskListResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const result = await this.tasksRepository.list(userId, normalizedFilters);
    const payload: TaskListResponseDto = {
      data: result.data.map(mapTask),
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / result.pageSize),
      },
    };

    await this.redisService.set(cacheKey, payload, 30);
    return payload;
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    const project = await this.tasksRepository.findProjectScope(projectId);

    if (!project) {
      throw new ForbiddenException("Access denied to project");
    }

    await this.organizationsService.requirePermission(
      userId,
      project.organizationId,
      "task:create",
    );

    await this.ensureAssigneeCanAccessProject(projectId, dto.assigneeId);

    const task = await this.tasksRepository.create(projectId, userId, dto);

    await this.taskEventsService.publish({
      type: "task.created",
      projectId,
      taskId: task.id,
      actorId: userId,
      title: task.title,
    });

    return mapTask(task);
  }

  async findById(taskId: string, userId: string): Promise<TaskDetailsDto> {
    const task = await this.tasksRepository.findById(taskId, userId);

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    return mapTaskDetails(task);
  }

  async update(taskId: string, userId: string, dto: UpdateTaskDto): Promise<TaskDetailsDto> {
    const existing = await this.findTaskForAction(taskId, userId, "task:update");

    if (dto.assigneeId !== undefined) {
      await this.ensureAssigneeCanAccessProject(existing.projectId, dto.assigneeId);
    }

    const updated = await this.tasksRepository.update(taskId, dto);
    const changes = this.collectChanges(existing, dto);

    await this.taskEventsService.publish({
      type: "task.updated",
      projectId: existing.projectId,
      taskId,
      actorId: userId,
      changes,
    });

    return mapTaskDetails(updated);
  }

  async addComment(taskId: string, userId: string, body: string) {
    const existing = await this.findTaskForAction(taskId, userId, "task:comment");

    const comment = await this.commentsRepository.create(taskId, userId, body);

    await this.taskEventsService.publish({
      type: "task.commented",
      projectId: existing.projectId,
      taskId,
      actorId: userId,
      body,
    });

    return mapComment(comment);
  }

  async listActivity(taskId: string, userId: string): Promise<TaskActivityDto[]> {
    const existing = await this.findTaskForAction(taskId, userId, "task:activity:read");

    const activity = await this.activityRepository.list(taskId);
    return activity.map(mapActivity);
  }

  private async findTaskForAction(
    taskId: string,
    userId: string,
    permission: OrganizationPermission,
  ) {
    const task = await this.tasksRepository.findById(taskId, userId);

    if (!task) {
      throw new NotFoundException("Task not found");
    }

    const project = await this.tasksRepository.findProjectScope(task.projectId);

    if (!project) {
      throw new NotFoundException("Task not found");
    }

    await this.organizationsService.requirePermission(
      userId,
      project.organizationId,
      permission,
    );

    return task;
  }

  private collectChanges(
    existing: {
      title: string;
      description: string | null;
      status: string;
      priority: string;
      assigneeId: string | null;
    },
    dto: UpdateTaskDto,
  ) {
    const fields: Array<keyof UpdateTaskDto> = ["title", "description", "status", "priority", "assigneeId"];

    return fields
      .filter((field) => dto[field] !== undefined && dto[field] !== existing[field])
      .map((field) => ({
        field,
        beforeValue: this.toActivityValue(existing[field]),
        afterValue: this.toActivityValue(dto[field]),
      }));
  }

  private toActivityValue(value: string | null | undefined) {
    return value === null || value === undefined ? null : String(value);
  }

  private async ensureAssigneeCanAccessProject(projectId: string, assigneeId?: string | null) {
    if (!assigneeId) {
      return;
    }

    const project = await this.tasksRepository.userCanAccessProject(projectId, assigneeId);

    if (!project) {
      throw new BadRequestException("Assignee must belong to the project organization");
    }
  }

  private normalizeFilters(filters: TaskFiltersDto): TaskFiltersDto {
    return {
      projectId: filters.projectId,
      search: filters.search?.trim() || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      assigneeId: filters.assigneeId?.trim() || undefined,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 20,
    };
  }
}
