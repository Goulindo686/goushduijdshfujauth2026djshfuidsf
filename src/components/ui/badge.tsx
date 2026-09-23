import * as React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "danger" | "warning" | "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-[#27272A] bg-[#18181B] text-neutral-300",
    success: "border-emerald-800/40 bg-emerald-950/40 text-emerald-400 font-medium",
    danger: "border-rose-900/40 bg-rose-950/40 text-rose-400 font-medium",
    warning: "border-amber-800/40 bg-amber-950/40 text-amber-400 font-medium",
    outline: "border-[#27272A] text-neutral-400",
  };

  return (
    <div
      className={twMerge(
        clsx(
          "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono uppercase tracking-wider transition-colors",
          variants[variant],
          className
        )
      )}
      {...props}
    />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  if (s === "ACTIVE" || s === "SUCCESS") {
    return <Badge variant="success">{status}</Badge>;
  }
  if (s === "BANNED" || s === "REVOKED" || s === "FAILED" || s === "BLOCKED") {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (s === "EXPIRED" || s === "PAUSED" || s === "MAINTENANCE") {
    return <Badge variant="warning">{status}</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
}
