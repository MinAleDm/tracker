import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import type { RequestUser } from "../../common/auth/request-user";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: RequestUser, @Query("organizationId") organizationId?: string) {
    return this.usersService.listUsers(user.userId, organizationId);
  }
}
