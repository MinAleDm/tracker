"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Textarea } from "@tracker/ui";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function ProjectCreate({ organizationId }: { organizationId: string }) {
  const [keyValue, setKeyValue] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.createProject({
        organizationId,
        key: keyValue.toUpperCase(),
        name,
        description,
      }),
    onSuccess: async () => {
      setKeyValue("");
      setName("");
      setDescription("");
      setExpanded(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects(organizationId) });
    },
  });

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/38">Новый проект</p>
          <p className="mt-1 text-sm font-medium text-white/82">Добавить рабочую область</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="rounded-[18px] text-white hover:bg-white/10"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Скрыть" : "Открыть"}
        </Button>
      </div>

      {expanded ? (
        <div className="mt-4 grid gap-3">
          <Input
            placeholder="Ключ"
            value={keyValue}
            onChange={(event) => setKeyValue(event.target.value)}
            className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
          />
          <Input
            placeholder="Название проекта"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
          />
          <Textarea
            rows={3}
            placeholder="Короткое описание"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="border-white/10 bg-white/10 text-white placeholder:text-white/35"
          />
          <Button
            type="button"
            variant="primary"
            className="rounded-2xl bg-white text-[#111827] hover:bg-white/90"
            disabled={mutation.isPending || !keyValue.trim() || !name.trim()}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Создаю..." : "Создать проект"}
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-white/42">Форма скрыта, чтобы не перегружать боковую панель.</p>
      )}

      {mutation.error ? (
        <p className="mt-3 text-sm text-rose-200">Не удалось создать проект. Проверь уникальность ключа.</p>
      ) : null}
    </div>
  );
}
