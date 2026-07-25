import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
