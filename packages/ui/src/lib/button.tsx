import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends PropsWithChildren, ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ children, className, variant = "secondary", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-9 items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 active:enabled:translate-y-px",
        {
          "bg-[#25282e] text-white shadow-sm hover:bg-[#17191d]": variant === "primary",
          "border border-border bg-card text-text shadow-sm hover:bg-muted": variant === "secondary",
          "bg-transparent text-text hover:bg-muted": variant === "ghost",
          "bg-rose-600 text-white hover:bg-rose-700": variant === "danger",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
