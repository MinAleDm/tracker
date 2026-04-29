export const TASK_STATUS_OPTIONS = [
  { value: "ALL", label: "Все статусы" },
  { value: "TODO", label: "Открыт" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "REVIEW", label: "Ревью" },
  { value: "DONE", label: "Закрыт" },
] as const;

export const TASK_PRIORITY_OPTIONS = [
  { value: "ALL", label: "Все приоритеты" },
  { value: "LOW", label: "Низкий" },
  { value: "MEDIUM", label: "Средний" },
  { value: "HIGH", label: "Высокий" },
  { value: "URGENT", label: "Критичный" },
] as const;
