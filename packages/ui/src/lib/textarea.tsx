import type { TextareaHTMLAttributes } from "react";
import clsx from "clsx";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text outline-none transition placeholder:text-text/35",
        "focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:cursor-not-allowed disabled:bg-muted disabled:text-text/48",
        className,
      )}
      {...props}
    />
  );
}
