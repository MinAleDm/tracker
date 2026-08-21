import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request, Response } from "express";

const REFRESH_COOKIE_NAME = "tracker_refresh";

function parseCookies(header: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();

  for (const part of header?.split(";") ?? []) {
    const separator = part.indexOf("=");
    if (separator < 1) {
      continue;
    }

    const name = part.slice(0, separator).trim();
    const rawValue = part.slice(separator + 1).trim();

    try {
      cookies.set(name, decodeURIComponent(rawValue));
    } catch {
      // Invalid cookie encoding is treated as an absent credential.
    }
  }

  return cookies;
}

@Injectable()
export class RefreshSessionCookieService {
  constructor(private readonly configService: ConfigService) {}

  read(request: Request): string | null {
    return parseCookies(request.headers.cookie).get(REFRESH_COOKIE_NAME) ?? null;
  }

  set(response: Response, token: string, expiresAt: Date): void {
    response.cookie(REFRESH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.configService.get("COOKIE_SECURE") === "true",
      sameSite: "strict",
      path: "/api/v1/auth",
      expires: expiresAt,
    });
  }

  clear(response: Response): void {
    response.clearCookie(REFRESH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.configService.get("COOKIE_SECURE") === "true",
      sameSite: "strict",
      path: "/api/v1/auth",
    });
  }
}
