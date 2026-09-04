"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { differenceInDays, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Mail,
  Phone,
  Search,
  Users,
  X,
} from "lucide-react";

import { PermissionGate } from "@/components/auth/permission-gate";
import { PanelHeader } from "./panel-header";
import { StatusBadge } from "./status-badge";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { formatCurrency } from "@/lib/format";
import { useDebounced } from "@/hooks/use-debounced";
import { cn } from "@/lib/utils";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Client {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: "registered" | "guest";
  totalAppointments: number;
  lastAppointment: string | null;
  totalSpent: number;
  tags: Tag[];
  createdAt: string;
}

interface ClientDetail {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  type: string;
  createdAt: string;
  totalSpent: number;
  appointments: {
    id: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    status: string;
    price: number;
    paymentStatus?: string | null;
    paymentAmount?: number | null;
  }[];
}

/**
 * How a segment is decided.
 *
 * Every rule here is computed from something the product actually records —
 * the count of turnos and the date of the last one. The design also shows a
 * "Cumplen este mes" segment; there is no date of birth anywhere in the schema,
 * so that one is not here rather than being faked from nothing.
 */
const SEGMENTS = [
  { id: "todos", label: "Todos", match: () => true },
  {
    id: "frecuentes",
    label: "Frecuentes",
    match: (client: Client) => client.totalAppointments >= 5,
  },
  {
    // Two months without coming back, after having come at least once. This is
    // the only segment that asks for an action rather than describing one.
    id: "riesgo",
    label: "En riesgo",
    match: (client: Client) =>
      client.totalAppointments > 0 &&
      client.lastAppointment !== null &&
      differenceInDays(new Date(), new Date(client.lastAppointment)) > 60,
  },
  {
    id: "nuevos",
    label: "Nuevos",
    match: (client: Client) => differenceInDays(new Date(), new Date(client.createdAt)) <= 30,
  },
] as const;

const AVATAR_TONES = [
  "bg-primary text-primary-foreground",
  "bg-staff-2-fill text-staff-2-strong",
  "bg-warning-muted text-warning-foreground",
  "bg-muted text-muted-foreground",
];

function initials(name: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ClientsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [segment, setSegment] = useState<string>("todos");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const params = new URLSearchParams({ page: String(page), pageSize: "20" });
  if (debouncedSearch) params.set("search", debouncedSearch);

  const { data, isLoading } = useSWR(`/api/panel/clients?${params}`);
  const { data: clientDetail } = useSWR(
    selectedClientId ? `/api/panel/clients/${selectedClientId}` : null
  );
  const { data: settingsData } = useSWR("/api/panel/settings");

  const clients: Client[] = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };
  const detail: ClientDetail | null = clientDetail ?? null;

  const counts = useMemo(
    () =>
      Object.fromEntries(
        SEGMENTS.map((entry) => [entry.id, clients.filter(entry.match).length])
      ) as Record<string, number>,
    [clients]
  );

  const shown = clients.filter(
    SEGMENTS.find((entry) => entry.id === segment)?.match ?? (() => true)
  );

  async function handleExportClientsPdf() {
    const { exportClientsPdf } = await import("@/lib/pdf/export-clients");
    await exportClientsPdf(clients, settingsData?.business?.name || "Mi Negocio");
  }

  async function handleExportProfilePdf() {
    if (!detail) return;
    const { exportClientProfilePdf } = await import("@/lib/pdf/export-client-profile");
    await exportClientProfilePdf(detail, settingsData?.business?.name || "Mi Negocio");
  }

  if (isLoading) return <TableSkeleton rows={8} />;

  const riesgo = counts.riesgo ?? 0;
  const nuevos = counts.nuevos ?? 0;

  return (
    <div>
      <PanelHeader
        title="Clientes"
        subtitle={[
          `${pagination.total} ${pagination.total === 1 ? "cliente" : "clientes"}`,
          riesgo > 0 && `${riesgo} en riesgo`,
          nuevos > 0 && `${nuevos} nuevos este mes`,
        ]
          .filter(Boolean)
          .join(" · ")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[220px]">
          <Search className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            placeholder="Buscar cliente"
            aria-label="Buscar cliente"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
                className="w-full rounded-[9px] border border-border bg-card py-2 pl-9 pr-3 text-xs outline-none transition-colors focus:border-primary"
              />
            </div>
            <PermissionGate permission="reports:export">
              <button
                type="button"
                onClick={handleExportClientsPdf}
                className="flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-faint"
              >
                <FileText className="size-3" /> Exportar
              </button>
            </PermissionGate>
          </div>
        }
      />

      <div className="mb-3.5 flex flex-wrap gap-[7px] text-[11.5px]">
        {SEGMENTS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setSegment(entry.id)}
            aria-pressed={segment === entry.id}
            className={cn(
              "rounded-full px-3.5 py-1.5 transition-colors",
              segment === entry.id
                ? "border border-jade-link/30 bg-jade-fill font-semibold text-jade-label"
                : entry.id === "riesgo" && counts.riesgo > 0
                  ? "border border-warning/40 bg-card text-warning-foreground"
                  : "border border-border bg-card text-muted-foreground hover:border-faint"
            )}
          >
            {entry.label} · {counts[entry.id] ?? 0}
          </button>
        ))}
      </div>

      <div className="grid gap-3.5 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[9.5px] uppercase tracking-[0.1em] text-faint">
                  <th className="px-5 py-3 font-bold">Cliente</th>
                  <th className="px-5 py-3 font-bold">Último turno</th>
                  <th className="px-5 py-3 font-bold">Turnos</th>
                  <th className="px-5 py-3 font-bold">Gastado</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {shown.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                      <Users className="mx-auto mb-3 size-9 text-disabled" aria-hidden />
                      <p className="text-sm font-semibold">Nadie en este segmento todavía</p>
                    </td>
                  </tr>
                ) : (
                  shown.map((client, index) => {
                    const days = client.lastAppointment
                      ? differenceInDays(new Date(), new Date(client.lastAppointment))
                      : null;
                    const selected = selectedClientId === client.id;
                    return (
                      <tr
                        key={`${client.type}-${client.id}`}
                        onClick={() => setSelectedClientId(client.id)}
                        className={cn(
                          "cursor-pointer border-b border-border-row transition-colors last:border-b-0",
                          selected ? "bg-primary/[0.07]" : "hover:bg-muted/50"
                        )}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                                AVATAR_TONES[index % AVATAR_TONES.length]
                              )}
                              aria-hidden
                            >
                              {initials(client.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-[12.5px] font-semibold">
                                <span className="truncate">{client.name || "Sin nombre"}</span>
                                {client.tags.slice(0, 1).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="shrink-0 rounded-full px-[7px] py-0.5 text-[8.5px] font-bold uppercase"
                                    style={{ background: `${tag.color}22`, color: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {days !== null && days > 60 && (
                                  <span className="shrink-0 rounded-full bg-warning-muted px-[7px] py-0.5 text-[8.5px] font-bold uppercase text-warning-foreground">
                                    En riesgo
                                  </span>
                                )}
                              </p>
                              <p className="truncate text-[10px] text-faint">
                                {client.email || client.phone || "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-[11.5px]",
                            days !== null && days > 60
                              ? "text-warning-foreground"
                              : "text-muted-foreground"
                          )}
                        >
                          {days === null
                            ? "—"
                            : days === 0
                              ? "hoy"
                              : days === 1
                                ? "ayer"
                                : `hace ${days} días`}
                        </td>
                        <td className="px-5 py-3 text-[11.5px] text-muted-foreground">
                          {client.totalAppointments}
                        </td>
                        <td
                          className={cn(
                            "px-5 py-3 text-[11.5px] font-semibold",
                            client.totalSpent > 0 && "font-bold text-jade-label"
                          )}
                        >
                          {formatCurrency(client.totalSpent)}
                        </td>
                        <td className="px-5 py-3 text-right text-[10.5px] font-semibold text-jade-link">
                          Abrir ficha →
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3">
              <p className="text-[11px] text-muted-foreground">
                {pagination.total} cliente{pagination.total !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Página anterior"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="px-2 text-[11px]">
                  {page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  aria-label="Página siguiente"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="flex size-8 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/*
          The file is a column on a wide screen and a sheet on anything else. It
          used to be `hidden xl:block` only, so below 1280px — every phone and
          most laptops — clicking a client did nothing: the row lit up, the
          cursor said button, and the file was unreachable.
        */}
        {detail && (
          <aside className="hidden xl:block">
            <ClientCard
              detail={detail}
              onClose={() => setSelectedClientId(null)}
              onExportPdf={handleExportProfilePdf}
              className="sticky top-4"
            />
          </aside>
        )}

        {detail && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center xl:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha de ${detail.name || "cliente"}`}
          >
            <button
              aria-label="Cerrar"
              className="absolute inset-0 bg-black/50"
              onClick={() => setSelectedClientId(null)}
            />
            <ClientCard
              detail={detail}
              onClose={() => setSelectedClientId(null)}
              onExportPdf={handleExportProfilePdf}
              className="relative max-h-[85vh] w-full overflow-y-auto rounded-b-none sm:max-w-md sm:rounded-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The client's file, as the one highlighted thing on the screen.
 *
 * Jade border and a jade shadow: it is the answer to whatever you clicked, and
 * the design gives exactly one card per screen that treatment.
 */
function ClientCard({
  detail,
  onClose,
  onExportPdf,
  className,
}: {
  detail: ClientDetail;
  onClose: () => void;
  onExportPdf: () => void;
  className?: string;
}) {
  const completed = detail.appointments.filter((a) => a.status === "COMPLETED").length;
  const noShows = detail.appointments.filter((a) => a.status === "NO_SHOW").length;

  const favourite = useMemo(() => {
    const byService = new Map<string, number>();
    for (const appointment of detail.appointments) {
      byService.set(appointment.serviceName, (byService.get(appointment.serviceName) ?? 0) + 1);
    }
    return [...byService.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [detail.appointments]);

  const habit = useMemo(() => {
    const bySlot = new Map<string, number>();
    for (const appointment of detail.appointments) {
      const when = new Date(appointment.dateTime);
      const key = `${format(when, "EEEE", { locale: es })} ${format(when, "HH:mm")}`;
      bySlot.set(key, (bySlot.get(key) ?? 0) + 1);
    }
    const [slot, times] = [...bySlot.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
    // One visit is not a habit.
    return times && times > 1 ? slot : null;
  }, [detail.appointments]);

  return (
    <div
      className={cn(
        "rounded-[14px] border-2 border-primary bg-card p-5 shadow-[0_16px_40px_-18px_rgba(74,222,128,0.4)]",
        className
      )}
    >
      <div className="mb-3.5 flex items-center gap-3">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-extrabold text-primary-foreground"
          aria-hidden
        >
          {initials(detail.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold">{detail.name || "Sin nombre"}</p>
          <p className="text-[10.5px] text-muted-foreground">
            Cliente desde {format(new Date(detail.createdAt), "MMM yyyy", { locale: es })}
          </p>
        </div>
        <button
          type="button"
          aria-label="Cerrar el detalle del cliente"
          onClick={onClose}
          className="flex size-7 shrink-0 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mb-3.5 grid grid-cols-3 gap-[7px]">
        <Stat value={String(completed)} label="Turnos" highlight />
        <Stat value={formatCurrency(detail.totalSpent)} label="Gastado" />
        <Stat value={String(noShows)} label="Ausencias" />
      </div>

      {(favourite || habit) && (
        <>
          <SectionLabel>Hábitos</SectionLabel>
          <dl className="mb-3.5 flex flex-col gap-1.5 text-[11.5px] text-muted-foreground">
            {favourite && (
              <div className="flex justify-between gap-3">
                <dt>Servicio favorito</dt>
                <dd className="truncate font-semibold text-foreground">{favourite}</dd>
              </div>
            )}
            {habit && (
              <div className="flex justify-between gap-3">
                <dt>Suele venir</dt>
                <dd className="truncate font-semibold capitalize text-foreground">{habit}</dd>
              </div>
            )}
          </dl>
        </>
      )}

      <SectionLabel>Contacto</SectionLabel>
      <div className="mb-3.5 flex flex-col gap-1.5">
        {detail.phone && (
          <a
            href={`https://wa.me/${detail.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-2 text-[11.5px] text-muted-foreground transition-colors hover:text-jade-label"
          >
            <Phone className="size-3.5" aria-hidden /> {detail.phone}
          </a>
        )}
        {detail.email && (
          <a
            href={`mailto:${detail.email}`}
            className="flex items-center gap-2 text-[11.5px] text-muted-foreground transition-colors hover:text-jade-label"
          >
            <Mail className="size-3.5" aria-hidden /> {detail.email}
          </a>
        )}
      </div>

      <SectionLabel>Historial</SectionLabel>
      <div className="mb-3.5 max-h-[280px] space-y-1.5 overflow-y-auto">
        {detail.appointments.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Sin turnos todavía.</p>
        )}
        {detail.appointments.map((appointment) => (
          <div key={appointment.id} className="rounded-[9px] bg-background p-2">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-semibold">{appointment.serviceName}</p>
              <StatusBadge status={appointment.status} className="shrink-0 text-[8.5px]" />
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {format(new Date(appointment.dateTime), "dd/MM/yy HH:mm", { locale: es })} ·{" "}
              {appointment.staffName}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-[7px]">
        <Link
          href="/panel/turnos?nuevo=1"
          className="flex-1 rounded-[9px] bg-primary py-2.5 text-center text-[11.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
        >
          Nuevo turno
        </Link>
        <PermissionGate permission="reports:export">
          <button
            type="button"
            onClick={onExportPdf}
            className="flex-1 rounded-[9px] border border-border py-2.5 text-[11.5px] text-muted-foreground transition-colors hover:border-faint"
          >
            Exportar ficha
          </button>
        </PermissionGate>
      </div>
    </div>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="rounded-[9px] border border-border-subtle bg-background p-2 text-center">
      <p className={cn("text-[15px] font-extrabold", highlight && "text-jade-label")}>{value}</p>
      <p className="mt-px text-[8.5px] text-faint">{label}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[7px] text-[9.5px] font-bold uppercase tracking-[0.1em] text-faint">
      {children}
    </p>
  );
}
