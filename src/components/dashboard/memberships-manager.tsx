"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CreditCard,
  Plus,
  Loader2,
  X,
  RefreshCw,
  Minus,
  Users,
  Ban,
} from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { errorMessage, messageOf } from "@/lib/api-message";
import { useDebounced } from "@/hooks/use-debounced";
import { TableSkeleton } from "@/components/skeletons/dashboard-skeleton";

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  includedVisits: number;
  durationDays: number;
  priorityDays: number;
  benefits: string[];
  maxMembers: number | null;
  isActive: boolean;
  _count: { memberships: number };
}

interface Member {
  id: string;
  planName: string;
  clientName: string;
  clientPhone: string | null;
  endDate: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  remaining: number;
  includedVisits: number;
}

/**
 * Abonos: the shop selling "cuatro cortes al mes" instead of charging per visit.
 *
 * The visits left on a membership are the sum of its credit ledger, never a
 * counter — so every number on this screen has a history behind it, and
 * "¿por qué le quedan dos?" always has an answer.
 */
export function MembershipsManager() {
  /*
    Plans and members on one screen, not behind two tabs.

    The question this page answers is "how much of next month is already sold",
    and that needs both halves at once: the plans on offer and who is on them.
    With the tabs, the number was on neither.
  */
  const { data: plansData } = useSWR<{ data: Plan[] }>("/api/panel/membresias/planes");
  const { data: membersData } = useSWR<{ data: Member[] }>(
    "/api/panel/membresias/socios?status=ACTIVE"
  );

  const plans = useMemo(() => plansData?.data ?? [], [plansData]);
  const members = useMemo(() => membersData?.data ?? [], [membersData]);

  const priceByPlan = new Map(plans.map((plan) => [plan.name, plan.price]));
  const monthly = members.reduce((sum, member) => sum + (priceByPlan.get(member.planName) ?? 0), 0);

  /*
    The clock is read after the render, not during it: `Date.now()` in the body
    makes the same props produce two different counts, which is exactly what
    React's purity rule is about. Null until the effect runs, so the tile shows
    a dash for one frame rather than a number that then changes.
  */
  const [renewals, setRenewals] = useState<number | null>(null);
  useEffect(() => {
    const now = Date.now();
    const weekAhead = now + 7 * 86_400_000;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRenewals(
      members.filter((member) => {
        const ends = new Date(member.endDate).getTime();
        return ends >= now && ends <= weekAhead;
      }).length
    );
  }, [members]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <MembershipKpi
          featured
          label="Ingreso mensual asegurado"
          value={formatCurrency(monthly)}
          note={`${members.length} ${members.length === 1 ? "socio activo" : "socios activos"}`}
        />
        <MembershipKpi
          label="Planes en venta"
          value={String(plans.filter((plan) => plan.isActive).length)}
          note={plans.length > 0 ? `${plans.length} creados en total` : "todavía no creaste ninguno"}
        />
        <MembershipKpi
          label="Renovaciones esta semana"
          value={renewals === null ? "—" : String(renewals)}
          note="cobro automático por Mercado Pago"
          tone={renewals !== null && renewals > 0 ? "warning" : undefined}
        />
      </div>

      <PlansTab />
      <MembersTab />
    </div>
  );
}

function MembershipKpi({
  label,
  value,
  note,
  featured,
  tone,
}: {
  label: string;
  value: string;
  note: string;
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

function PlansTab() {
  const { data, isLoading, mutate } = useSWR<{ data: Plan[] }>("/api/panel/membresias/planes");
  const [creating, setCreating] = useState(false);

  if (isLoading) return <TableSkeleton rows={3} />;

  const plans = data?.data ?? [];

  async function toggle(plan: Plan) {
    try {
      const res = await fetch(`/api/panel/membresias/planes/${plan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !plan.isActive }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos actualizar el plan"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg brand-gradient text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Nuevo plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-2">
          <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="font-heading font-semibold">Todavía no vendés abonos</p>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Un abono es un precio fijo por mes con una cantidad de turnos
            incluidos. Es la forma de que el mes deje de depender de quién
            aparezca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="glass rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading font-semibold truncate">{plan.name}</p>
                  <p className="text-2xl font-heading font-bold mt-1">
                    {formatCurrency(plan.price)}
                    <span className="text-xs text-muted-foreground font-normal">
                      {" "}
                      / {plan.durationDays} días
                    </span>
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                    plan.isActive
                      ? "bg-success-muted text-success-foreground"
                      : "bg-neutral-muted text-neutral-foreground"
                  }`}
                >
                  {plan.isActive ? "Activo" : "Pausado"}
                </span>
              </div>

              <p className="text-sm text-muted-foreground">
                {plan.includedVisits > 0
                  ? `${plan.includedVisits} turnos incluidos`
                  : "Sin turnos incluidos"}
                {plan.priorityDays > 0 && ` · reserva ${plan.priorityDays} días antes`}
              </p>

              {plan.benefits.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {plan.benefits.map((benefit) => (
                    <li key={benefit}>· {benefit}</li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {plan._count.memberships} socios
                  {plan.maxMembers && ` / ${plan.maxMembers}`}
                </span>
                <button
                  onClick={() => toggle(plan)}
                  className="text-xs text-primary hover:underline"
                >
                  {plan.isActive ? "Pausar" : "Reactivar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PlanDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => mutate()}
      />
    </div>
  );
}

function PlanDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [includedVisits, setIncludedVisits] = useState("4");
  const [durationDays, setDurationDays] = useState("30");
  const [priorityDays, setPriorityDays] = useState("0");
  const [benefits, setBenefits] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/membresias/planes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          price: Number(price),
          includedVisits: Number(includedVisits),
          durationDays: Number(durationDays),
          priorityDays: Number(priorityDays),
          benefits: benefits
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Plan creado");
      setName("");
      setPrice("");
      setBenefits("");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos crear el plan"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo plan de abono"
    >
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md glass rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">Nuevo plan</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label htmlFor="plan-nombre" className="text-xs text-muted-foreground">
            Nombre
          </label>
          <input
            id="plan-nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Abono mensual"
            className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="plan-precio" className="text-xs text-muted-foreground">
              Precio
            </label>
            <input
              id="plan-precio"
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="20000"
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="plan-turnos" className="text-xs text-muted-foreground">
              Turnos incluidos
            </label>
            <input
              id="plan-turnos"
              type="number"
              inputMode="numeric"
              value={includedVisits}
              onChange={(e) => setIncludedVisits(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="plan-dias" className="text-xs text-muted-foreground">
              Días que dura
            </label>
            <input
              id="plan-dias"
              type="number"
              inputMode="numeric"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="plan-prioridad" className="text-xs text-muted-foreground">
              Días de prioridad
            </label>
            <input
              id="plan-prioridad"
              type="number"
              inputMode="numeric"
              value={priorityDays}
              onChange={(e) => setPriorityDays(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="plan-beneficios" className="text-xs text-muted-foreground">
            Beneficios (uno por línea)
          </label>
          <textarea
            id="plan-beneficios"
            value={benefits}
            onChange={(e) => setBenefits(e.target.value)}
            rows={3}
            placeholder={"10% off en productos\nBebida de cortesía"}
            className="w-full px-3 py-2 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={save}
          disabled={saving || name.trim().length < 2 || !Number(price)}
          className="w-full h-11 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Crear plan
        </button>
      </div>
    </div>
  );
}

function MembersTab() {
  const [status, setStatus] = useState("ACTIVE");
  const { data, isLoading, mutate } = useSWR<{ data: Member[] }>(
    `/api/panel/membresias/socios?status=${status}`
  );
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, body: Record<string, unknown>, done: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/panel/membresias/socios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success(done);
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos hacer el cambio"));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <TableSkeleton rows={5} />;

  const members = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filtrar socios"
          className="h-9 px-3 rounded-lg bg-muted/50 border border-border text-sm"
        >
          <option value="ACTIVE">Activos</option>
          <option value="EXPIRED">Vencidos</option>
          <option value="CANCELLED">Cancelados</option>
          <option value="ALL">Todos</option>
        </select>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-lg brand-gradient text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Dar de alta un socio
        </button>
      </div>

      {members.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center space-y-2">
          <Users className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="font-heading font-semibold">Todavía no hay socios acá</p>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Cuando des de alta a alguien en un abono, sus turnos restantes se
            descuentan solos cada vez que reserva.
          </p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">Socio</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    Plan
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Restantes</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Vence
                  </th>
                  <th className="p-3 text-xs font-medium text-muted-foreground w-40" />
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border/50">
                    <td className="p-3">
                      <p className="text-sm font-medium">{member.clientName}</p>
                      {member.clientPhone && (
                        <p className="text-xs text-muted-foreground">{member.clientPhone}</p>
                      )}
                    </td>
                    <td className="p-3 hidden sm:table-cell text-sm text-muted-foreground">
                      {member.planName}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-sm font-medium ${
                          member.remaining === 0 ? "text-muted-foreground" : ""
                        }`}
                      >
                        {member.remaining}
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          / {member.includedVisits}
                        </span>
                      </span>
                    </td>
                    <td className="p-3 hidden md:table-cell text-sm text-muted-foreground">
                      {format(new Date(member.endDate), "dd/MM/yy", { locale: es })}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            act(member.id, { adjustVisits: 1, reason: "Turno de cortesía" }, "Turno agregado")
                          }
                          disabled={busyId === member.id}
                          aria-label={`Sumarle un turno a ${member.clientName}`}
                          title="Sumar un turno"
                          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() =>
                            act(member.id, { adjustVisits: -1, reason: "Ajuste manual" }, "Turno descontado")
                          }
                          disabled={busyId === member.id || member.remaining === 0}
                          aria-label={`Descontarle un turno a ${member.clientName}`}
                          title="Descontar un turno"
                          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => act(member.id, { renew: true }, "Período renovado")}
                          disabled={busyId === member.id}
                          aria-label={`Renovar el abono de ${member.clientName}`}
                          title="Renovar el período"
                          className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-50"
                        >
                          {busyId === member.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {member.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              act(member.id, { status: "CANCELLED" }, "Membresía cancelada")
                            }
                            disabled={busyId === member.id}
                            aria-label={`Cancelar el abono de ${member.clientName}`}
                            title="Cancelar la membresía"
                            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <MemberDialog open={adding} onClose={() => setAdding(false)} onSaved={() => mutate()} />
    </div>
  );
}

function MemberDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: plansData } = useSWR<{ data: Plan[] }>(
    open ? "/api/panel/membresias/planes" : null
  );
  const [planId, setPlanId] = useState("");
  const [search, setSearch] = useState("");
  const [guestClientId, setGuestClientId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const debounced = useDebounced(search);
  const { data: clientsData } = useSWR(
    open && debounced.length >= 2
      ? `/api/panel/clients?search=${encodeURIComponent(debounced)}&pageSize=5`
      : null
  );

  const plans = (plansData?.data ?? []).filter((plan) => plan.isActive);
  const clients: { id: string; name: string | null; phone: string | null }[] =
    clientsData?.data ?? [];
  const chosen = clients.find((client) => client.id === guestClientId);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/membresias/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          ...(guestClientId
            ? { guestClientId }
            : { name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined }),
        }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      const created = await res.json();
      toast.success(`${created.clientName} es socio de ${created.planName}`);
      setPlanId("");
      setName("");
      setPhone("");
      setEmail("");
      setGuestClientId(null);
      onSaved();
      onClose();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos dar de alta al socio"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Dar de alta un socio"
    >
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md glass rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold">Dar de alta un socio</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Primero creá un plan en la pestaña Planes.
          </p>
        ) : (
          <>
            <div>
              <label htmlFor="socio-plan" className="text-xs text-muted-foreground">
                Plan
              </label>
              <select
                id="socio-plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm"
              >
                <option value="">Elegí uno</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} — {formatCurrency(plan.price)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="socio-cliente" className="text-xs text-muted-foreground">
                Cliente
              </label>
              {chosen ? (
                <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-sm truncate">{chosen.name || "Sin nombre"}</span>
                  <button
                    onClick={() => setGuestClientId(null)}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="socio-cliente"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscalo por nombre o teléfono"
                    className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  {clients.length > 0 && (
                    <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                      {clients.map((client) => (
                        <button
                          key={client.id}
                          onClick={() => {
                            setGuestClientId(client.id);
                            setSearch("");
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                        >
                          {client.name || "Sin nombre"}
                          {client.phone && (
                            <span className="text-muted-foreground"> · {client.phone}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">O cargalo nuevo:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre"
                      aria-label="Nombre del socio nuevo"
                      className="h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Teléfono"
                      aria-label="Teléfono del socio nuevo"
                      className="h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email (opcional)"
                    aria-label="Email del socio nuevo"
                    className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </>
              )}
            </div>

            <button
              onClick={save}
              disabled={saving || !planId || (!guestClientId && name.trim().length < 2)}
              className="w-full h-11 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Dar de alta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
