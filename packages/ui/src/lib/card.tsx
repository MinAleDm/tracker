import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-[28px] border border-black/[0.08] bg-white/92 shadow-[0_18px_38px_rgba(15,23,42,0.06)] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
