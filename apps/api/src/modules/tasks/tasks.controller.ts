import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { RequestUser } from "../../common/auth/request-user";
import { CreateCommentBodyDto } from "./dto/create-comment.dto";
import { CreateTaskBodyDto } from "./dto/create-task.dto";
import { QueryTasksDto } from "./dto/query-tasks.dto";
import { UpdateTaskBodyDto } from "./dto/update-task.dto";
import { TasksService } from "./tasks.service";

@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get("projects/:projectId/tasks")
  list(
    @CurrentUser() user: RequestUser,
    @Param("projectId") projectId: string,
    @Query() query: QueryTasksDto,
  ) {
    return this.tasksService.list(user.userId, {
      ...query,
      projectId,
    });
  }

  @Post("projects/:projectId/tasks")
  create(
    @CurrentUser() user: RequestUser,
    @Param("projectId") projectId: string,
    @Body() dto: CreateTaskBodyDto,
  ) {
    return this.tasksService.create(projectId, user.userId, dto);
  }

  @Get("tasks/:taskId")
  findOne(@CurrentUser() user: RequestUser, @Param("taskId") taskId: string) {
    return this.tasksService.findById(taskId, user.userId);
  }

  @Patch("tasks/:taskId")
  update(
    @CurrentUser() user: RequestUser,
    @Param("taskId") taskId: string,
    @Body() dto: UpdateTaskBodyDto,
  ) {
    return this.tasksService.update(taskId, user.userId, dto);
  }

  @Post("tasks/:taskId/comments")
  addComment(
    @CurrentUser() user: RequestUser,
    @Param("taskId") taskId: string,
    @Body() dto: CreateCommentBodyDto,
  ) {
    return this.tasksService.addComment(taskId, user.userId, dto.body);
  }

  @Get("tasks/:taskId/activity")
  activity(@CurrentUser() user: RequestUser, @Param("taskId") taskId: string) {
    return this.tasksService.listActivity(taskId, user.userId);
  }
}
