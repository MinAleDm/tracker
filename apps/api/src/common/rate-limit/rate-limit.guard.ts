import {
  type CanActivate,
  type ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request, Response } from "express";
import { RATE_LIMIT_KEY, type RateLimitPolicy } from "./rate-limit.decorator";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_POLICY: RateLimitPolicy = { limit: 300, windowMs: 60_000 };
const MAX_TRACKED_CLIENTS = 10_000;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? DEFAULT_POLICY;
    const now = Date.now();
    const key = `${request.ip}:${request.method}:${request.path}`;
    const current = this.entries.get(key);
    const entry = !current || current.resetAt <= now
      ? { count: 1, resetAt: now + policy.windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };

    this.entries.set(key, entry);
    this.prune(now);

    response.setHeader("RateLimit-Limit", policy.limit);
    response.setHeader("RateLimit-Remaining", Math.max(0, policy.limit - entry.count));
    response.setHeader("RateLimit-Reset", Math.ceil(entry.resetAt / 1_000));

    if (entry.count > policy.limit) {
      response.setHeader("Retry-After", Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)));
      throw new HttpException("Too many requests", HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private prune(now: number): void {
    if (this.entries.size <= MAX_TRACKED_CLIENTS) {
      return;
    }

    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now || this.entries.size > MAX_TRACKED_CLIENTS) {
        this.entries.delete(key);
      }
    }
  }
}
