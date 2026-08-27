import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
      },
      tone: {
        neutral: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/14 text-amber-700 dark:text-amber-400",
        danger: "border-transparent bg-destructive/12 text-destructive",
      },
    },
    defaultVariants: { variant: "secondary", tone: "neutral" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, tone }), className)} {...props} />;
}
