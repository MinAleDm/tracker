import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { Public } from "../../common/auth/public.decorator";
import { RateLimit } from "../../common/rate-limit/rate-limit.decorator";
import type { RequestUser } from "../../common/auth/request-user";
import { LoginBodyDto } from "./dto/login.dto";
import { AuthService } from "./auth.service";
import { RefreshSessionCookieService } from "./refresh-session-cookie.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshCookie: RefreshSessionCookieService,
  ) {}

  @Public()
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @Post("login")
  @HttpCode(200)
  async login(@Body() dto: LoginBodyDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(dto);
    this.refreshCookie.set(response, result.refreshToken, result.refreshExpiresAt);
    response.setHeader("Cache-Control", "no-store");
    return result.session;
  }

  @Public()
  @RateLimit({ limit: 30, windowMs: 60_000 })
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.refresh(this.refreshCookie.read(request));
    this.refreshCookie.set(response, result.refreshToken, result.refreshExpiresAt);
    response.setHeader("Cache-Control", "no-store");
    return result.tokens;
  }

  @Public()
  @RateLimit({ limit: 30, windowMs: 60_000 })
  @Post("logout")
  @HttpCode(204)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(this.refreshCookie.read(request));
    this.refreshCookie.clear(response);
  }

  @Get("me")
  me(@CurrentUser() user: RequestUser) {
    return this.authService.me(user.userId);
  }
}
