"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskPriority, UserSummaryDto } from "@tracker/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Textarea,
} from "@tracker/ui";
import { apiClient } from "@/lib/api-client";
import { priorityLabels } from "@/lib/task-meta";
import { PlusIcon } from "@/shared/ui/tracker-icons";
import { useUiStore } from "@/store/use-ui-store";

export function TaskCreate({
  projectId,
  users,
  showTrigger = true,
}: {
  projectId: string;
  users: UserSummaryDto[];
  showTrigger?: boolean;
}) {
  const open = useUiStore((state) => state.taskComposerOpen);
  const setOpen = useUiStore((state) => state.setTaskComposerOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.createTask(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assigneeId: assigneeId || undefined,
      }),
    onSuccess: async () => {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setAssigneeId("");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return (
    <>
      {showTrigger ? (
        <Button type="button" onClick={() => setOpen(true)}>
          <PlusIcon className="mr-2" size={16} />
          Новая задача
        </Button>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>Зафиксируйте результат, который должен получить исполнитель.</DialogDescription>
          </DialogHeader>

          <form
            className="space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (title.trim().length >= 3) mutation.mutate();
            }}
          >
            <label className="block space-y-2 text-sm font-medium">
              <span>Название</span>
              <Input
                autoFocus
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  mutation.reset();
                }}
                placeholder="Что должно быть сделано?"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Описание</span>
              <Textarea
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Контекст, критерии готовности и полезные ссылки"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium">
                <span>Приоритет</span>
                <Select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
                  {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </label>
              <label className="block space-y-2 text-sm font-medium">
                <span>Исполнитель</span>
                <Select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
                  <option value="">Без исполнителя</option>
                  {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </Select>
              </label>
            </div>

            {mutation.error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">Не удалось создать задачу. Повторите попытку.</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="submit" disabled={mutation.isPending || title.trim().length < 3}>
                {mutation.isPending ? "Создаю…" : "Создать задачу"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
