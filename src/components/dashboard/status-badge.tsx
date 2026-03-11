"use client";

import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING_PAYMENT: {
    label: "Pago pendiente",
    className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  PENDING: {
    label: "Pendiente",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  COMPLETED: {
    label: "Completado",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
  NO_SHOW: {
    label: "No asistió",
    className: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
