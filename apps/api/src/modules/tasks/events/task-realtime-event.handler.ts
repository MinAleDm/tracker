import { Injectable } from "@nestjs/common";
import { RealtimeService } from "../../realtime/realtime.service";
import type { TaskDomainEvent } from "./task-domain-event";
import type { TaskDomainEventHandler } from "./task-domain-event-handler";

const REALTIME_ACTION_BY_EVENT = {
  "task.created": "created",
  "task.updated": "updated",
  "task.commented": "commented",
} as const;

@Injectable()
export class TaskRealtimeEventHandler implements TaskDomainEventHandler {
  constructor(private readonly realtimeService: RealtimeService) {}

  async handle(event: TaskDomainEvent): Promise<void> {
    this.realtimeService.publishTaskEvent({
      projectId: event.projectId,
      taskId: event.taskId,
      action: REALTIME_ACTION_BY_EVENT[event.type],
    });
  }
}

