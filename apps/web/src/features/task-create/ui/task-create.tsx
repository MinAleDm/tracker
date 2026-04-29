"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskPriority, UserSummaryDto } from "@tracker/types";
import { Button, Input, Select, Textarea } from "@tracker/ui";
import { apiClient } from "@/lib/api-client";
import { priorityLabels } from "@/lib/task-meta";
import { PlusIcon } from "@/shared/ui/tracker-icons";

export function TaskCreate({
  projectId,
  users,
  focusSignal = 0,
}: {
  projectId: string;
  users: UserSummaryDto[];
  focusSignal?: number;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (focusSignal > 0) {
      titleRef.current?.focus();
    }
  }, [focusSignal]);

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.createTask(projectId, {
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId || undefined,
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssigneeId("");
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      titleRef.current?.focus();
    },
  });

  return (
    <form
      className="border-y border-black/[0.08] py-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (title.trim().length >= 3) {
          mutation.mutate();
        }
      }}
    >
      <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[minmax(240px,1.25fr)_minmax(220px,1fr)_170px_220px_150px]">
        <Input
          ref={titleRef}
          placeholder="Новая задача: что нужно сделать?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-xl border-black/[0.12] bg-transparent py-3 text-sm"
        />
        <Textarea
          rows={1}
          placeholder="Контекст, критерий готовности или ссылка"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-[48px] rounded-xl border-black/[0.12] bg-transparent py-3 text-sm"
        />
        <Select
          value={priority}
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          className="rounded-xl border-black/[0.12] bg-transparent py-3 text-sm"
        >
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          value={assigneeId}
          onChange={(event) => setAssigneeId(event.target.value)}
          className="rounded-xl border-black/[0.12] bg-transparent py-3 text-sm"
        >
          <option value="">Без исполнителя</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </Select>
        <Button
          type="submit"
          variant="primary"
          className="rounded-xl bg-[#111827] px-4 py-3 text-sm hover:bg-[#020617]"
          disabled={mutation.isPending || title.trim().length < 3}
        >
          <PlusIcon className="mr-2" size={18} />
          {mutation.isPending ? "Создаю" : "Создать"}
        </Button>
      </div>
      {mutation.error ? (
        <p className="mt-3 text-sm font-medium text-rose-600">Не удалось создать задачу. Проверьте доступность API.</p>
      ) : null}
    </form>
  );
}
