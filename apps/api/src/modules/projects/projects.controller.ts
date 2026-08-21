import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { RequestUser } from "../../common/auth/request-user";
import { CreateProjectBodyDto } from "./dto/create-project.dto";
import { ProjectsService } from "./projects.service";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser, @Query("organizationId") organizationId: string) {
    return this.projectsService.list(user.userId, organizationId);
  }

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateProjectBodyDto) {
    return this.projectsService.create(user.userId, dto);
  }
}
