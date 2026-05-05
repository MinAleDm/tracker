import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "./task.constants";

function toOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export class QueryTasksDto {
  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsIn(TASK_STATUS_VALUES)
  status?: (typeof TASK_STATUS_VALUES)[number];

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsIn(TASK_PRIORITY_VALUES)
  priority?: (typeof TASK_PRIORITY_VALUES)[number];

  @IsOptional()
  @Transform(({ value }) => toOptionalString(value))
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}
