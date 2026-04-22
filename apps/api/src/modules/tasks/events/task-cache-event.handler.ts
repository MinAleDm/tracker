import { Injectable } from "@nestjs/common";
import { RedisService } from "../../../common/redis/redis.service";
import type { TaskDomainEvent } from "./task-domain-event";
import type { TaskDomainEventHandler } from "./task-domain-event-handler";

@Injectable()
export class TaskCacheEventHandler implements TaskDomainEventHandler {
  constructor(private readonly redisService: RedisService) {}

  async handle(event: TaskDomainEvent): Promise<void> {
    await this.redisService.deleteByPrefix(`tasks:${event.projectId}:`);
  }
}

