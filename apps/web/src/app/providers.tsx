"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useUiStore } from "@/store/use-ui-store";

export function Providers({ children }: PropsWithChildren) {
  const hydrated = useUiStore((state) => state.hydrated);
  const setSession = useUiStore((state) => state.setSession);
  const completeAuthBootstrap = useUiStore((state) => state.completeAuthBootstrap);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let active = true;

    void apiClient
      .restoreSession()
      .then((session) => {
        if (active && session) {
          setSession({ accessToken: session.accessToken, user: session.user });
        }
      })
      .catch(() => {
        if (active) {
          useUiStore.getState().clearSession();
        }
      })
      .finally(() => {
        if (active) {
          completeAuthBootstrap();
        }
      });

    return () => {
      active = false;
    };
  }, [completeAuthBootstrap, hydrated, setSession]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
