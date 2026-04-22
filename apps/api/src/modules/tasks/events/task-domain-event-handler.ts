import type { TaskDomainEvent } from "./task-domain-event";

export const TASK_DOMAIN_EVENT_HANDLERS = Symbol("TASK_DOMAIN_EVENT_HANDLERS");

export interface TaskDomainEventHandler {
  handle(event: TaskDomainEvent): Promise<void>;
}

