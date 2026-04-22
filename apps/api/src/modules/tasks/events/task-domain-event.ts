import type { UpdateTaskDto } from "@tracker/types";

export interface TaskFieldChange {
  field: keyof UpdateTaskDto;
  beforeValue: string | null;
  afterValue: string | null;
}

export interface TaskCreatedEvent {
  type: "task.created";
  projectId: string;
  taskId: string;
  actorId: string;
  title: string;
}

export interface TaskUpdatedEvent {
  type: "task.updated";
  projectId: string;
  taskId: string;
  actorId: string;
  changes: TaskFieldChange[];
}

export interface TaskCommentedEvent {
  type: "task.commented";
  projectId: string;
  taskId: string;
  actorId: string;
  body: string;
}

export type TaskDomainEvent = TaskCreatedEvent | TaskUpdatedEvent | TaskCommentedEvent;

