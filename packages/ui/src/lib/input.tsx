import type { ComponentPropsWithRef } from "react";
import clsx from "clsx";

export function Input({ className, ...props }: ComponentPropsWithRef<"input">) {
  return (
    <input
      className={clsx(
        "w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-text outline-none transition focus:border-accent",
        className,
      )}
      {...props}
    />
  );
}
