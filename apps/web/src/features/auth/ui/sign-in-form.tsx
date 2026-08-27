"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Card, Input } from "@tracker/ui";
import { LockKeyhole } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/store/use-ui-store";

export function SignInForm() {
  const router = useRouter();
  const setSession = useUiStore((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => apiClient.login(email, password),
    onSuccess: (session) => {
      setSession({ accessToken: session.tokens.accessToken, user: session.user });
      router.replace("/");
    },
  });

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-muted/35 px-4 py-8">
      <Card className="w-full max-w-md p-6 shadow-soft sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span className="size-4 rotate-45 rounded-[3px] border-2 border-current" />
          </span>
          <div>
            <p className="font-semibold">Tracker</p>
            <p className="text-sm text-muted-foreground">Рабочее пространство</p>
          </div>
        </div>

        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Вход</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Используйте учётные данные рабочего пространства.
        </p>

        <form
          className="mt-6 space-y-4"
          aria-busy={mutation.isPending}
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <label className="block space-y-2 text-sm font-medium">
            <span>Email</span>
            <Input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              autoFocus
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                mutation.reset();
              }}
              className="h-11"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium">
            <span>Пароль</span>
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                mutation.reset();
              }}
              className="h-11"
            />
          </label>

          {mutation.error ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              Не удалось войти. Проверьте email и пароль или повторите попытку через минуту.
            </p>
          ) : null}

          <Button type="submit" className="h-11 w-full" disabled={mutation.isPending}>
            <span aria-live="polite">{mutation.isPending ? "Входим…" : "Войти"}</span>
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <LockKeyhole size={14} />
          Refresh-сессия защищена HttpOnly cookie
        </p>
      </Card>
    </main>
  );
}
