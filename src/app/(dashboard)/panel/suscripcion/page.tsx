"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Check,
  Crown,
  Zap,
  Users,
  Calendar,
  BarChart2,
  MapPin,
  Megaphone,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Presentation only. Prices, names and limits come from the API — this file
 * used to carry its own copy of them and they drifted apart from the backend.
 */
const PLAN_PRESENTATION: Record<string, { icon: typeof Zap; popular?: boolean; extras: string[] }> = {
  PROFESSIONAL: {
    icon: Zap,
    popular: true,
    extras: [
      "Cobros con Mercado Pago",
      "Ficha de cada cliente",
      "Botón de reservas en tu web",
      "Reseñas de tus clientes",
    ],
  },
  ENTERPRISE: {
    icon: Crown,
    extras: [
      "Todo lo del plan Inicial",
      "Membresías: cobrales un abono mensual",
      "Campañas para traerlos de vuelta",
      "Turnos y profesionales sin tope",
      "Reportes avanzados",
      "Varias sucursales y marca blanca",
    ],
  },
};

interface CatalogPlan {
  key: string;
  name: string;
  price: number;
  limits: { maxStaff: number | null };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AUTHORIZED: { label: "Activa", color: "bg-success-muted text-success-foreground border-success/20" },
  PENDING: { label: "Pendiente", color: "bg-warning-muted text-warning-foreground border-warning/20" },
  PAUSED: { label: "Pausada", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  CANCELLED: { label: "Cancelada", color: "bg-neutral-muted text-neutral-foreground border-neutral/20" },
  EXPIRED: { label: "Expirada", color: "bg-danger-muted text-danger-foreground border-danger/20" },
};

/** Two minutes of polling. Past that, MercadoPago is not coming back to us. */
const MAX_CALLBACK_POLLS = 40;

/** Local alias; the format itself lives in @/lib/format. */
function formatPrice(amount: number) {
  return formatCurrency(amount);
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const isCallback = searchParams.get("result") === "callback";
  const { data, isLoading, mutate } = useSWR("/api/panel/subscription");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  // Poll on callback until the subscription is AUTHORIZED.
  //
  // Capped on purpose. Unbounded, a subscription that never gets authorised
  // meant a request every three seconds for as long as the tab stayed open —
  // 1200 an hour, from a user who is already stuck.
  useEffect(() => {
    if (!isCallback) return;

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;

      if (attempts > MAX_CALLBACK_POLLS) {
        clearInterval(interval);
        toast.info("Todavía no nos llegó la confirmación. Recargá en un rato.");
        return;
      }

      mutate().then((res) => {
        if (res?.subscription?.status === "AUTHORIZED") {
          clearInterval(interval);
          toast.success("Suscripción activada correctamente");
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isCallback, mutate]);

  async function handleSubscribe(plan: string) {
    setSubscribing(plan);
    try {
      const res = await fetch("/api/panel/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // Redirect to MP checkout
      window.location.href = json.initPoint;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al crear suscripción");
      setSubscribing(null);
    }
  }

  async function handleCancel() {
    setConfirmingCancel(false);
    setCancelling(true);
    try {
      const res = await fetch("/api/panel/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelado desde el panel" }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error);
      }
      toast.success("Suscripción cancelada");
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    } finally {
      setCancelling(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const usage = data?.usage;
  const subscription = data?.subscription;
  const catalog: CatalogPlan[] = data?.catalog ?? [];
  const trial = data?.trial;
  const blocked = Boolean(data?.blocked);
  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;

  return (
    <div className="space-y-8 max-w-5xl">
      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title="Cancelar la suscripción"
        description="Mantenés el acceso hasta el final del período que ya pagaste. Después, el negocio vuelve al plan gratuito."
        confirmLabel="Cancelar la suscripción"
        cancelLabel="Volver"
        destructive
        onConfirm={handleCancel}
      />

      <div>
        <h1 className="text-2xl font-heading font-bold">Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Administrá tu plan y facturación</p>
      </div>

      {blocked && (
        <div
          role="alert"
          className="rounded-xl border border-danger/20 bg-danger-muted px-6 py-4"
        >
          <p className="font-heading font-semibold text-danger-foreground">
            Tu prueba gratis terminó
          </p>
          <p className="text-sm text-danger-foreground/80 mt-1">
            Podés seguir viendo todo, pero no cargar ni modificar nada hasta que
            elijas un plan. Tu página de reservas sigue funcionando y tus
            clientes pueden seguir sacando turno.
          </p>
        </div>
      )}

      {!blocked && trial?.daysLeft > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-4">
          <p className="font-heading font-semibold">
            {trial.daysLeft === 1
              ? "Te queda 1 día de prueba"
              : `Te quedan ${trial.daysLeft} días de prueba`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tenés todas las funcionalidades disponibles. Elegí un plan antes de
            que termine para no quedarte sin poder operar.
          </p>
        </div>
      )}

      {/* Current plan + status */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold">
                Plan {data?.planName ?? "Sin plan"}
              </h2>
              {statusInfo && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
          </div>
          {subscription && (subscription.status === "AUTHORIZED" || subscription.status === "PAUSED") && (
            <button
              onClick={() => setConfirmingCancel(true)}
              disabled={cancelling}
              className="text-sm px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelando..." : "Cancelar suscripción"}
            </button>
          )}
        </div>

        {/* Usage meters */}
        {usage && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <UsageMeter
              icon={Users}
              label="Profesionales"
              current={usage.staff}
              limit={usage.staffLimit}
            />
            <UsageMeter
              icon={Calendar}
              label="Turnos este mes"
              current={usage.appointments}
              limit={usage.appointmentsLimit}
            />
          </div>
        )}

        {subscription?.nextPaymentDate && subscription.status === "AUTHORIZED" && (
          <p className="text-xs text-muted-foreground pt-2">
            Próximo cobro: {new Date(subscription.nextPaymentDate).toLocaleDateString("es-AR")}
          </p>
        )}
        {subscription?.gracePeriodEnd && subscription.status === "PAUSED" && (
          <p className="text-xs text-orange-500 pt-2">
            Período de gracia hasta: {new Date(subscription.gracePeriodEnd).toLocaleDateString("es-AR")}
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {catalog.map((plan) => {
          const presentation = PLAN_PRESENTATION[plan.key];
          const isCurrent = subscription?.plan === plan.key && subscription?.status === "AUTHORIZED";
          const showSubscribe = !isCurrent && (
            plan.key === "ENTERPRISE"
              ? subscription?.plan !== "ENTERPRISE"
              : !subscription || subscription.status !== "AUTHORIZED"
          );
          const PlanIcon = presentation.icon;
          const features = [
            plan.limits.maxStaff === null
              ? "Profesionales ilimitados"
              : `Hasta ${plan.limits.maxStaff} profesionales`,
            ...presentation.extras,
          ];

          return (
            <div
              key={plan.key}
              className={`glass rounded-xl p-6 flex flex-col ${
                presentation.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {presentation.popular && (
                <div className="text-xs font-medium text-primary mb-2">Más popular</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <PlanIcon className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-lg">{plan.name}</h3>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-heading font-bold">{formatPrice(plan.price)}</span>
                <span className="text-sm text-muted-foreground ml-1">/mes</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Se renueva todos los meses. Cancelás cuando quieras.</p>

              <ul className="space-y-2 flex-1 mb-6">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="text-center text-sm font-medium text-muted-foreground py-2 border border-border rounded-lg">
                  Plan actual
                </div>
              ) : showSubscribe ? (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing !== null}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {subscribing === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Elegir {plan.name}</>
                  )}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Feature comparison */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-heading font-semibold">Comparación de funcionalidades</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 font-medium text-muted-foreground">Funcionalidad</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Inicial</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Completo</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Profesionales", pro: "3", ent: "Ilimitados", icon: Users },
                { name: "Turnos/mes", pro: "Ilimitados", ent: "Ilimitados", icon: Calendar },
                { name: "Cobros MP", pro: true, ent: true, icon: CreditCard },
                { name: "CRM y tags", pro: true, ent: true, icon: Shield },
                { name: "Campañas", pro: true, ent: true, icon: Megaphone },
                { name: "Reportes avanzados", pro: true, ent: true, icon: BarChart2 },
                { name: "Multi-sucursal", pro: false, ent: true, icon: MapPin },
                { name: "Marca blanca", pro: false, ent: true, icon: Crown },
              ].map((row) => (
                <tr key={row.name} className="border-b border-border/50">
                  <td className="px-6 py-3 flex items-center gap-2">
                    <row.icon className="w-4 h-4 text-muted-foreground" />
                    {row.name}
                  </td>
                  <td className="text-center px-4 py-3">{renderCell(row.pro)}</td>
                  <td className="text-center px-4 py-3">{renderCell(row.ent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function renderCell(value: boolean | string) {
  if (typeof value === "string") return <span className="text-sm">{value}</span>;
  return value ? (
    <Check className="w-4 h-4 text-primary mx-auto" />
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

function UsageMeter({
  icon: Icon,
  label,
  current,
  limit,
}: {
  icon: React.ElementType;
  label: string;
  current: number;
  limit: number | null;
}) {
  const percentage = limit ? Math.min((current / limit) * 100, 100) : 0;
  const isNearLimit = limit && percentage >= 80;

  return (
    <div className="p-3 rounded-lg bg-muted/30 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className={`font-medium ${isNearLimit ? "text-orange-500" : ""}`}>
          {current}{limit ? `/${limit}` : ""}
          {!limit && " (ilimitado)"}
        </span>
      </div>
      {limit && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? "bg-orange-500" : "bg-primary"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
