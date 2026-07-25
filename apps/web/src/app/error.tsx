"use client";

import { useEffect } from "react";
import { Button } from "@tracker/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="grid min-h-screen place-items-center bg-surface px-5 py-12">
      <section className="tracker-panel w-full max-w-lg rounded-xl p-8 text-center">
        <p className="font-mono text-xs font-semibold uppercase text-danger">Unexpected error</p>
        <h1 className="mt-3 text-2xl font-semibold text-text">Что-то пошло не так</h1>
        <p className="mt-2 text-sm leading-6 text-text/54">
          Интерфейс не смог завершить операцию. Повторите попытку — текущая сессия останется активной.
        </p>
        <Button type="button" variant="primary" className="mt-6" onClick={reset}>
          Повторить
        </Button>
      </section>
    </main>
  );
}
