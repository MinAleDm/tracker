import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction) {
    const startedAt = Date.now();
    const incomingRequestId = request.header("x-request-id");
    const requestId = incomingRequestId && /^[a-zA-Z0-9._-]{8,64}$/.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();

    response.setHeader("X-Request-Id", requestId);

    response.on("finish", () => {
      const duration = Date.now() - startedAt;
      this.logger.log(JSON.stringify({
        requestId,
        method: request.method,
        path: request.path,
        statusCode: response.statusCode,
        durationMs: duration,
      }));
    });

    next();
  }
}
import { randomUUID } from "node:crypto";
