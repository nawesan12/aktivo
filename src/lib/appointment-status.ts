import type { AppointmentStatus } from "@/generated/prisma/client";

/**
 * The single source of truth for how an appointment status looks and reads.
 *
 * There were four different maps: the panel painted COMPLETED emerald and
 * CONFIRMED blue, while the customer's own "mis turnos" page painted CONFIRMED
 * green and COMPLETED blue. The same booking looked like two different things
 * depending on who was looking at it.
 */

export interface StatusStyle {
  label: string;
  /** Pill used in tables, lists and detail views. */
  badge: string;
  /** Solid colour for calendar blocks and legend dots. */
  dot: string;
  /** Button colour for the action that moves an appointment *into* this state. */
  action: string;
}

/**
 * Colours come from the semantic tokens in `globals.css`, not from literal
 * Tailwind shades. That is what makes them adapt to light mode — the literals
 * were tuned for the dark theme and washed out on white — and keeps them
 * independent from the business's own brand colour.
 */
export const APPOINTMENT_STATUS_STYLES: Record<AppointmentStatus, StatusStyle> = {
  PENDING_PAYMENT: {
    label: "Pago pendiente",
    badge: "bg-warning-muted text-warning-foreground border-warning/20",
    dot: "bg-warning",
    action: "bg-warning hover:opacity-90 text-white",
  },
  PENDING: {
    label: "Pendiente",
    badge: "bg-warning-muted text-warning border-warning/20",
    dot: "bg-warning/70",
    action: "bg-warning/80 hover:opacity-90 text-white",
  },
  CONFIRMED: {
    label: "Confirmado",
    badge: "bg-info-muted text-info-foreground border-info/20",
    dot: "bg-info",
    action: "bg-info hover:opacity-90 text-white",
  },
  COMPLETED: {
    label: "Completado",
    badge: "bg-success-muted text-success-foreground border-success/20",
    dot: "bg-success",
    action: "bg-success hover:opacity-90 text-white",
  },
  CANCELLED: {
    label: "Cancelado",
    badge: "bg-danger-muted text-danger-foreground border-danger/20",
    dot: "bg-danger",
    action: "bg-danger-muted hover:bg-danger/20 text-danger-foreground",
  },
  NO_SHOW: {
    label: "No asistió",
    badge: "bg-neutral-muted text-neutral-foreground border-neutral/20",
    dot: "bg-neutral",
    action: "bg-neutral-muted hover:bg-neutral/20 text-neutral-foreground",
  },
};

const UNKNOWN: StatusStyle = {
  label: "Desconocido",
  badge: "bg-muted text-muted-foreground border-border",
  dot: "bg-muted-foreground",
  action: "bg-muted text-muted-foreground",
};

/** Tolerates a plain string, because API payloads arrive untyped. */
export function statusStyle(status: string): StatusStyle {
  return APPOINTMENT_STATUS_STYLES[status as AppointmentStatus] ?? UNKNOWN;
}

export function statusLabel(status: string): string {
  return statusStyle(status).label;
}

/** Order used by every status filter, from newest booking to final outcome. */
export const APPOINTMENT_STATUS_ORDER: AppointmentStatus[] = [
  "PENDING_PAYMENT",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

/** Ready to spread into a `<select>` or a filter dropdown. */
export const APPOINTMENT_STATUS_OPTIONS = APPOINTMENT_STATUS_ORDER.map((value) => ({
  value,
  label: APPOINTMENT_STATUS_STYLES[value].label,
}));

/** Nothing else happens to an appointment once it reaches one of these. */
export const TERMINAL_STATUSES: AppointmentStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.includes(status as AppointmentStatus);
}
