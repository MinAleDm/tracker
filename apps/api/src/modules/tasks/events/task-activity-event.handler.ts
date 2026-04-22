import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../activity.repository";
import type { TaskDomainEvent } from "./task-domain-event";
import type { TaskDomainEventHandler } from "./task-domain-event-handler";

@Injectable()
export class TaskActivityEventHandler implements TaskDomainEventHandler {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async handle(event: TaskDomainEvent): Promise<void> {
    if (event.type === "task.created") {
      await this.activityRepository.create({
        taskId: event.taskId,
        actorId: event.actorId,
        action: event.type,
        afterValue: event.title,
      });

      return;
    }

    if (event.type === "task.updated") {
      for (const change of event.changes) {
        await this.activityRepository.create({
          taskId: event.taskId,
          actorId: event.actorId,
          action: event.type,
          field: change.field,
          beforeValue: change.beforeValue,
          afterValue: change.afterValue,
        });
      }

      return;
    }

    await this.activityRepository.create({
      taskId: event.taskId,
      actorId: event.actorId,
      action: event.type,
      afterValue: event.body,
    });
  }
}

