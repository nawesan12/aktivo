"use client";

import Link from "next/link";
import useSWR from "swr";
import { format, formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale";

import { PanelHeader } from "@/components/dashboard/panel-header";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PLAN_NAMES } from "@/lib/subscription/config";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Job {
  name: string;
  lastRunAt: string;
  lastError: string | null;
  runs: number;
  /** Decided on the server: more than a day since it last ran. */
  stale: boolean;
}

interface AdminStats {
  totalBusinesses: number;
  totalUsers: number;
  appointmentsThisMonth: number;
  revenueThisMonth: number;
  businessesThisMonth: number;
  usersThisMonth: number;
  appointmentsChange: number | null;
  byPlan: { plan: string; count: number }[];
  jobs: Job[];
  today: string;
  recentBusinesses: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    createdAt: string;
  }[];
}

const PLAN_TONES: Record<string, string> = {
  ENTERPRISE: "bg-success-muted text-jade-label",
  PROFESSIONAL: "bg-muted text-muted-foreground",
  STARTER: "bg-warning-muted text-warning-foreground",
};

const DONUT = ["#4ADE80", "#a78bfa", "#fbbf24"];
const PLAN_ORDER = ["ENTERPRISE", "PROFESSIONAL", "STARTER"];

const AVATAR_TONES = [
  "bg-primary text-primary-foreground",
  "bg-staff-2-fill text-staff-2-strong",
  "bg-warning-muted text-warning-foreground",
];

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * The platform, from the inside.
 *
 * The two blocks on the right are the ones that were missing: what the
 * scheduled work actually did (read from `JobRun`, the row each job claims
 * before it runs, so it is a fact rather than an assumption that the cron
 * fired) and how the businesses are split across the plans.
 */
export default function AdminDashboardPage() {
  const { data, isLoading } = useSWR<AdminStats>("/api/admin/stats");

  if (isLoading || !data) return <DashboardSkeleton />;

  const stale = data.jobs.filter((job) => job.stale).length;
  const failing = data.jobs.filter((job) => job.lastError).length;

  const planTotal = data.byPlan.reduce((sum, row) => sum + row.count, 0);
  const ordered = PLAN_ORDER.map((plan) => ({
    plan,
    count: data.byPlan.find((row) => row.plan === plan)?.count ?? 0,
  }));
  // Built with reduce rather than a mutable cursor: the lint rule that forbids
  // reassigning across a map callback is right, the slices are a running sum.
  const conic = ordered
    .reduce<{ from: number; stops: string[] }>(
      (acc, row, index) => {
        const share = planTotal > 0 ? (row.count / planTotal) * 100 : 0;
        return {
          from: acc.from + share,
          stops: [...acc.stops, `${DONUT[index]} ${acc.from}% ${acc.from + share}%`],
        };
      },
      { from: 0, stops: [] }
    )
    .stops.join(", ");

  return (
    <div>
      <PanelHeader
        title="Plataforma"
        subtitle={format(new Date(data.today), "EEEE d 'de' MMMM", { locale: es })}
        action={
          <span
            className={cn(
              "flex items-center gap-[7px] rounded-full border border-border bg-card px-3.5 py-1.5 text-[11px] font-semibold",
              failing > 0 || stale > 0 ? "text-warning-foreground" : "text-jade-label"
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                failing > 0 || stale > 0 ? "bg-warning" : "bg-jade-link"
              )}
            />
            {failing > 0
              ? `${failing} job${failing === 1 ? "" : "s"} con error`
              : stale > 0
                ? `${stale} job${stale === 1 ? "" : "s"} sin correr hace un día`
                : "Todo operativo"}
          </span>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="Negocios"
          value={data.totalBusinesses.toLocaleString("es-AR")}
          note={data.businessesThisMonth > 0 ? `▲ +${data.businessesThisMonth} este mes` : "sin altas este mes"}
          positive={data.businessesThisMonth > 0}
        />
        <Tile
          label="Usuarios"
          value={data.totalUsers.toLocaleString("es-AR")}
          note={data.usersThisMonth > 0 ? `▲ +${data.usersThisMonth} este mes` : "sin altas este mes"}
          positive={data.usersThisMonth > 0}
        />
        <Tile
          label="Turnos este mes"
          value={data.appointmentsThisMonth.toLocaleString("es-AR")}
          note={
            data.appointmentsChange === null
              ? "primer mes con turnos"
              : `${data.appointmentsChange >= 0 ? "▲ +" : "▼ "}${data.appointmentsChange}% vs el mes pasado`
          }
          positive={(data.appointmentsChange ?? 0) >= 0}
        />
        <Tile
          label="Ingresos este mes"
          value={formatCurrency(data.revenueThisMonth)}
          note="señas cobradas por Mercado Pago"
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3.5">
            <h2 className="text-[13px] font-bold">Negocios recientes</h2>
            <Link href="/admin/negocios" className="text-[11px] font-semibold text-jade-link">
              Ver todos →
            </Link>
          </div>
          {data.recentBusinesses.map((business, index) => (
            <div
              key={business.id}
              className="flex items-center gap-3 border-b border-border-row px-5 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-[9px] text-[10px] font-extrabold",
                  AVATAR_TONES[index % AVATAR_TONES.length]
                )}
                aria-hidden
              >
                {initials(business.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold">{business.name}</p>
                <p className="truncate font-mono text-[10px] text-faint">/{business.slug}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-[3px] text-[9px] font-bold uppercase",
                  PLAN_TONES[business.plan] ?? "bg-muted text-muted-foreground"
                )}
              >
                {PLAN_NAMES[business.plan as keyof typeof PLAN_NAMES] ?? business.plan}
              </span>
              <span className="min-w-[66px] shrink-0 text-right text-[10.5px] text-faint">
                {format(new Date(business.createdAt), "d MMM", { locale: es })}
              </span>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-3">
          <section className="rounded-xl border border-border bg-card p-[18px]">
            <h2 className="mb-3 text-[13px] font-bold">Salud del sistema</h2>
            {data.jobs.length === 0 ? (
              <p className="text-[10.5px] text-muted-foreground">
                Todavía no corrió ningún trabajo programado.
              </p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {data.jobs.map((job) => {
                  const bad = Boolean(job.lastError) || job.stale;
                  return (
                    <li key={job.name} className="flex items-center justify-between gap-3">
                      <span className="truncate font-mono text-[10.5px] text-muted-foreground">
                        /cron/{job.name}
                      </span>
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1.5 text-[10.5px]",
                          bad ? "text-warning-foreground" : "text-jade-label"
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", bad ? "bg-warning" : "bg-jade-link")}
                        />
                        {job.lastError
                          ? "con error"
                          : `hace ${formatDistanceStrict(new Date(job.lastRunAt), new Date(data.today), { locale: es })}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-[18px]">
            <h2 className="mb-3 text-[13px] font-bold">Planes activos</h2>
            <div className="flex items-center gap-3.5">
              <div
                className="relative size-[76px] shrink-0 rounded-full"
                style={{ background: `conic-gradient(${conic})` }}
                aria-hidden
              >
                <div className="absolute inset-[9px] flex items-center justify-center rounded-full bg-card text-sm font-extrabold">
                  {planTotal}
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                {ordered.map((row, index) => (
                  <li key={row.plan} className="flex items-center gap-1.5">
                    <span
                      className="size-2 rounded-[3px]"
                      style={{ background: DONUT[index] }}
                    />
                    {PLAN_NAMES[row.plan as keyof typeof PLAN_NAMES] ?? row.plan} · {row.count}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  note,
  positive,
}: {
  label: string;
  value: string;
  note: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-[18px]">
      <p className="mb-2 text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[28px] font-extrabold tracking-[-0.03em]">{value}</p>
      <p className={cn("mt-1.5 text-[11px]", positive ? "text-jade-label" : "text-muted-foreground")}>
        {note}
      </p>
    </div>
  );
}
