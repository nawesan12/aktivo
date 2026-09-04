"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Download, FileText, Sparkles } from "lucide-react";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { PermissionGate } from "@/components/auth/permission-gate";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const RANGES = [
  { label: "30 días", value: "30d" },
  { label: "90 días", value: "90d" },
  { label: "Año", value: "365d" },
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** The heatmap's five steps, from an empty band to the busiest one. */
const HEAT = ["bg-muted", "bg-[#d1fae5]", "bg-[#a7f3d0]", "bg-[#6ee7b7]", "bg-[#10b981]", "bg-[#065f46]"];

const DONUT_COLOURS = ["#4ADE80", "#a78bfa", "#fbbf24", "#60a5fa", "#f87171"];

interface Named {
  name: string;
  count: number;
  revenue: number;
}

interface ReportsData {
  summary: { totalAppointments: number; totalRevenue: number; totalClients: number };
  byStaff: Named[];
  byService: Named[];
  heatmap: { band: string; days: number[] }[];
  peak: { band: string; weekday: number; count: number } | null;
  quiet: { band: string; weekday: number; count: number } | null;
  retention: number | null;
  ltv: number;
  noShowRate: number | null;
}

/**
 * Reportes: not the data, the answer.
 *
 * This screen absorbed what used to be a separate "Analytics" section — the
 * peak-hours heatmap, retention, LTV and no-shows — because two screens of
 * numbers about the same shop is one screen too many, and the one people opened
 * was whichever was higher in the sidebar. The banner at the top is the point:
 * a report nobody can act on is a report nobody reads twice.
 */
export function ReportsDashboard() {
  const [range, setRange] = useState("90d");
  const { data, isLoading } = useSWR<ReportsData>(`/api/panel/reports?range=${range}`);

  const byStaff = useMemo(
    () => [...(data?.byStaff ?? [])].sort((a, b) => b.revenue - a.revenue),
    [data]
  );
  const byService = useMemo(
    () => [...(data?.byService ?? [])].sort((a, b) => b.revenue - a.revenue),
    [data]
  );

  /* The name is fetched when somebody exports, not on every visit. */
  async function handleExportPdf() {
    const { exportReportsPdf } = await import("@/lib/pdf/export-reports");
    const access = await fetch("/api/panel/access").then((r) => r.json());
    await exportReportsPdf(
      { summary: data!.summary, byStaff, byService },
      range,
      access?.business?.name || "Mi Negocio"
    );
  }

  if (isLoading || !data) return <DashboardSkeleton />;

  const topStaffRevenue = byStaff[0]?.revenue ?? 0;
  const serviceTotal = byService.reduce((sum, service) => sum + service.revenue, 0);
  const star = byService[0];
  const starShare = serviceTotal > 0 && star ? Math.round((star.revenue / serviceTotal) * 100) : 0;

  const peakCount = data.peak?.count ?? 0;
  const conic = (() => {
    let cursor = 0;
    return byService
      .slice(0, 4)
      .map((service, index) => {
        const share = serviceTotal > 0 ? (service.revenue / serviceTotal) * 100 : 0;
        const stop = `${DONUT_COLOURS[index]} ${cursor}% ${cursor + share}%`;
        cursor += share;
        return stop;
      })
      .concat(`var(--border) ${cursor}% 100%`)
      .join(", ");
  })();

  return (
    <div>
      <PanelHeader
        title="Reportes"
        subtitle="No solo datos: respuestas"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-[3px] rounded-[9px] border border-border bg-card p-[3px] text-[11.5px]">
              {RANGES.map((entry) => (
                <button
                  key={entry.value}
                  type="button"
                  onClick={() => setRange(entry.value)}
                  aria-pressed={range === entry.value}
                  className={cn(
                    "rounded-[7px] px-3.5 py-1.5 transition-colors",
                    range === entry.value
                      ? "bg-jade-fill font-semibold text-jade-label"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {entry.label}
                </button>
              ))}
            </div>
            <PermissionGate permission="reports:export">
              <button
                type="button"
                onClick={() =>
                  window.open("/api/panel/reports/export?type=appointments&format=csv", "_blank")
                }
                className="flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-faint"
              >
                <Download className="size-3" /> CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-faint"
              >
                <FileText className="size-3" /> PDF
              </button>
            </PermissionGate>
          </div>
        }
      />

      {data.quiet && peakCount > 0 && (
        <div className="mb-3.5 flex flex-wrap items-center gap-3 rounded-[14px] border-2 border-primary bg-card px-5 py-4 shadow-jade">
          <span
            className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-jade-fill text-jade-label"
            aria-hidden
          >
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-[220px] flex-1">
            <p className="text-[13.5px] font-bold">
              Tus {WEEKDAYS[data.quiet.weekday - 1].toLowerCase()} de {data.quiet.band} son tu
              franja más floja
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              {data.quiet.count === 0
                ? "No tomaste ni un turno ahí en todo el período."
                : `${data.quiet.count} turnos, contra ${peakCount} en tu mejor franja.`}{" "}
              Un cupón para esa franja podría llenarla.
            </p>
          </div>
          <Link
            href="/panel/membresias?tab=cupones"
            className="shrink-0 rounded-[9px] bg-primary px-[18px] py-2.5 text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
          >
            Crear el cupón
          </Link>
        </div>
      )}

      <div className="mb-3.5 grid gap-3.5 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-[13px] font-bold">Horarios pico</h2>
          <p className="mb-3.5 text-[10.5px] text-faint">
            Turnos por día y franja · {RANGES.find((r) => r.value === range)?.label.toLowerCase()}
          </p>

          <div
            className="grid gap-1 text-[9px] text-faint"
            style={{ gridTemplateColumns: "42px repeat(6, minmax(0, 1fr))" }}
          >
            <span />
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-center">
                {day}
              </span>
            ))}

            {data.heatmap.map((row) => (
              <div key={row.band} className="contents">
                <span className="flex items-center font-mono">{row.band}</span>
                {row.days.map((count, index) => (
                  <div
                    key={index}
                    title={`${WEEKDAYS[index]} ${row.band}: ${count} turnos`}
                    className={cn(
                      "h-[30px] rounded-md",
                      HEAT[
                        peakCount === 0
                          ? 0
                          : Math.min(Math.ceil((count / peakCount) * (HEAT.length - 1)), HEAT.length - 1)
                      ],
                      data.quiet?.band === row.band &&
                        data.quiet.weekday === index + 1 &&
                        "border border-dashed border-warning"
                    )}
                  />
                ))}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-faint">
            <span>Menos</span>
            {HEAT.slice(1).map((tone) => (
              <span key={tone} className={cn("h-[9px] w-[13px] rounded-[3px]", tone)} />
            ))}
            <span>Más</span>
            {data.peak && peakCount > 0 && (
              <span className="ml-auto font-semibold text-jade-label">
                Pico: {WEEKDAYS[data.peak.weekday - 1].toLowerCase()} {data.peak.band}
              </span>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3.5">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-[13px] font-bold">Quién factura más</h2>
            {byStaff.length === 0 ? (
              <p className="text-[11.5px] text-muted-foreground">Sin turnos completados todavía.</p>
            ) : (
              <div className="flex flex-col gap-[11px]">
                {byStaff.slice(0, 4).map((member, index) => (
                  <div key={member.name}>
                    <div className="mb-1 flex justify-between text-[11.5px]">
                      <span className="truncate font-semibold">{member.name}</span>
                      <span
                        className={cn(
                          "shrink-0 font-bold",
                          index === 0 ? "text-jade-label" : "text-muted-foreground"
                        )}
                      >
                        {formatCurrency(member.revenue)}
                      </span>
                    </div>
                    <div className="h-[7px] overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${topStaffRevenue > 0 ? (member.revenue / topStaffRevenue) * 100 : 0}%`,
                          background: DONUT_COLOURS[index % DONUT_COLOURS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-[13px] font-bold">Servicio estrella</h2>
            {!star || serviceTotal === 0 ? (
              <p className="text-[11.5px] text-muted-foreground">Sin facturación en el período.</p>
            ) : (
              <div className="flex items-center gap-3.5">
                <div
                  className="relative size-[76px] shrink-0 rounded-full"
                  style={{ background: `conic-gradient(${conic})` }}
                  aria-hidden
                >
                  <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-card text-[13px] font-extrabold text-jade-label">
                    {starShare}%
                  </div>
                </div>
                <ul className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                  {byService.slice(0, 3).map((service, index) => (
                    <li key={service.name} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-[3px]"
                        style={{ background: DONUT_COLOURS[index] }}
                      />
                      <span className="truncate">{service.name}</span> ·{" "}
                      {formatCurrency(service.revenue)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Metric
          label="Retención a 60 días"
          value={data.retention !== null ? `${data.retention}%` : "—"}
          note={
            data.retention !== null
              ? "clientes que volvieron después de su primera visita"
              : "hace falta un trimestre de historia para calcularla"
          }
          tone="jade"
        />
        <Metric
          label="Valor de vida (LTV)"
          value={formatCurrency(data.ltv)}
          note="promedio facturado por cliente en el período"
        />
        <Metric
          label="Ausencias"
          value={data.noShowRate !== null ? `${data.noShowRate}%` : "—"}
          note="de los turnos que ya pasaron"
          tone={data.noShowRate !== null && data.noShowRate > 5 ? "warning" : undefined}
        />
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: "jade" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-[18px]">
      <p className="mb-2 text-[10.5px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-[26px] font-extrabold",
          tone === "jade" && "text-jade-label",
          tone === "warning" && "text-warning-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-[10.5px] text-muted-foreground">{note}</p>
    </div>
  );
}
