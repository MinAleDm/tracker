import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RedisService } from "../../common/redis/redis.service";

export interface HealthCheckResult {
  status: "ok" | "degraded" | "error";
  checks: {
    api: "ok";
    database?: "ok" | "error";
    redis?: "ok" | "optional-unavailable";
  };
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  live(): HealthCheckResult {
    return {
      status: "ok",
      checks: {
        api: "ok",
      },
      timestamp: new Date().toISOString(),
    };
  }

  async ready(): Promise<HealthCheckResult> {
    const databaseOk = await this.checkDatabase();
    const redisOk = await this.redisService.ping();

    return {
      status: databaseOk ? (redisOk ? "ok" : "degraded") : "error",
      checks: {
        api: "ok",
        database: databaseOk ? "ok" : "error",
        redis: redisOk ? "ok" : "optional-unavailable",
      },
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

