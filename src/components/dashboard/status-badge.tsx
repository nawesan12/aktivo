"use client";

import { cn } from "@/lib/utils";
import { statusStyle } from "@/lib/appointment-status";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, badge } = statusStyle(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        badge,
        className
      )}
    >
      {label}
    </span>
  );
}
