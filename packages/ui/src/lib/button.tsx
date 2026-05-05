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
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 focus:ring-accent/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-[#111827] text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)] hover:bg-[#020617]": variant === "primary",
          "border border-black/[0.08] bg-white text-text shadow-[0_8px_18px_rgba(15,23,42,0.06)] hover:bg-[#f8fafc]": variant === "secondary",
          "bg-transparent text-text hover:bg-black/[0.035]": variant === "ghost",
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
