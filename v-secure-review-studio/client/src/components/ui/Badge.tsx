import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeProps = {
  children: ReactNode;
  tone?: "cyan" | "violet" | "green" | "amber";
  className?: string;
};

export function Badge({ children, tone = "cyan", className }: BadgeProps) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}
