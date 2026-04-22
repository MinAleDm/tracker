import { Inject, Injectable } from "@nestjs/common";
import type { TaskDomainEvent } from "./task-domain-event";
import {
  TASK_DOMAIN_EVENT_HANDLERS,
  type TaskDomainEventHandler,
} from "./task-domain-event-handler";

@Injectable()
export class TaskEventsService {
  constructor(
    @Inject(TASK_DOMAIN_EVENT_HANDLERS)
    private readonly handlers: TaskDomainEventHandler[],
  ) {}

  async publish(event: TaskDomainEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler.handle(event);
    }
  }
}

