import type { SelectHTMLAttributes } from "react";
import clsx from "clsx";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text outline-none transition",
        "focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-text/48",
        className,
      )}
      {...props}
    />
  );
}
