"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  mode: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED" | string;
  createdAt: string;
  appointment: {
    dateTime: string;
    service: { name: string };
    staff: { name: string };
    user: { name: string | null } | null;
    guestClient: { name: string } | null;
  } | null;
}

interface Summary {
  collectedThisMonth: number;
  changeVsLastMonth: number | null;
  depositsAmount: number;
  depositsCount: number;
  pendingAmount: number;
  pendingCount: number;
}

const FILTERS = [
  { id: "", label: "Todos" },
  { id: "APPROVED", label: "Aprobados" },
  { id: "PENDING", label: "Pendientes" },
  { id: "REFUNDED", label: "Reembolsos" },
];

const STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "neutral"; sign: string; tone: string }> = {
  APPROVED: { label: "APROBADO", variant: "success", sign: "+", tone: "text-jade-label" },
  PENDING: { label: "PENDIENTE", variant: "warning", sign: "", tone: "text-warning-foreground" },
  REFUNDED: { label: "REEMBOLSO", variant: "danger", sign: "−", tone: "text-danger-foreground" },
  REJECTED: { label: "RECHAZADO", variant: "danger", sign: "", tone: "text-danger-foreground" },
};

function whenLabel(iso: string) {
  const date = new Date(iso);
  if (isToday(date)) return `Hoy ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Ayer ${format(date, "HH:mm")}`;
  return format(date, "d MMM HH:mm", { locale: es });
}

/**
 * What came in, and what is still in the air.
 *
 * The screen used to open on the MercadoPago connection box followed by a
 * settings form — everything about configuring payments and nothing about the
 * payments themselves, even though the API had been returning them all along.
 */
export function PaymentsOverview({ depositLabel }: { depositLabel: string }) {
  const [filter, setFilter] = useState("");
  const params = new URLSearchParams({ page: "1", pageSize: "25" });
  if (filter) params.set("status", filter);

  const { data, isLoading } = useSWR<{ data: Payment[]; summary: Summary }>(
    `/api/panel/payments?${params}`
  );

  if (isLoading || !data) return <TableSkeleton rows={6} />;

  const { summary } = data;

  return (
    <>
      <div className="mb-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          featured
          label="Cobrado este mes"
          value={formatCurrency(summary.collectedThisMonth)}
          note={
            summary.changeVsLastMonth === null
              ? "primer mes con cobros"
              : `${summary.changeVsLastMonth >= 0 ? "▲ +" : "▼ "}${summary.changeVsLastMonth}% vs el mes pasado`
          }
        />
        <Kpi
          label="Señas cobradas"
          value={formatCurrency(summary.depositsAmount)}
          note={`${summary.depositsCount} ${summary.depositsCount === 1 ? "turno señado" : "turnos señados"}`}
        />
        <Kpi
          label="Pendiente de pago"
          value={formatCurrency(summary.pendingAmount)}
          note={`${summary.pendingCount} ${summary.pendingCount === 1 ? "reserva reteniendo su horario" : "reservas reteniendo su horario"}`}
          tone="warning"
        />
        <Kpi
          label="Config. de seña"
          value={depositLabel}
          note={
            <Link href="#config-seña" className="font-semibold text-jade-link">
              Cambiar →
            </Link>
          }
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-5 py-3">
          <h2 className="text-[13px] font-bold">Movimientos</h2>
          <div className="flex flex-wrap gap-1 text-[10.5px]">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setFilter(entry.id)}
                aria-pressed={filter === entry.id}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  filter === entry.id
                    ? "bg-jade-fill font-semibold text-jade-label"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {data.data.length === 0 ? (
          <p className="px-5 py-12 text-center text-[12.5px] text-muted-foreground">
            {filter ? "Nada en este estado." : "Todavía no entró ningún pago."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-xs">
              <tbody>
                {data.data.map((payment) => {
                  const meta = STATUS[payment.status] ?? {
                    label: payment.status,
                    variant: "neutral" as const,
                    sign: "",
                    tone: "text-muted-foreground",
                  };
                  const client =
                    payment.appointment?.user?.name ??
                    payment.appointment?.guestClient?.name ??
                    "Sin nombre";

                  return (
                    <tr
                      key={payment.id}
                      className="border-b border-border-row transition-colors last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="w-[110px] px-5 py-3 font-mono text-[10.5px] text-faint">
                        {whenLabel(payment.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <b className="font-semibold">{client}</b>
                        {payment.appointment && (
                          <> · {payment.appointment.service.name}</>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {payment.appointment
                          ? format(new Date(payment.appointment.dateTime), "EEE d MMM · HH:mm", {
                              locale: es,
                            })
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-[11px] font-semibold text-[#009EE3]">
                        Mercado Pago
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className={cn("px-5 py-3 text-right font-bold", meta.tone)}>
                        {meta.sign}
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  note,
  featured,
  tone,
}: {
  label: string;
  value: string;
  note: React.ReactNode;
  featured?: boolean;
  tone?: "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card p-[18px]",
        featured ? "border-2 border-primary shadow-jade" : "border border-border"
      )}
    >
      <p className="mb-2 text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-[26px] font-extrabold tracking-[-0.03em]",
          featured && "text-jade-label",
          tone === "warning" && "text-warning-foreground"
        )}
      >
        {value}
      </p>
      <p className={cn("mt-1.5 text-[10.5px]", featured ? "text-jade-label" : "text-muted-foreground")}>
        {note}
      </p>
    </div>
  );
}
