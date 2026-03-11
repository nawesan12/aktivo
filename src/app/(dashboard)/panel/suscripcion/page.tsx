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

const PLANS = [
  {
    key: "PROFESSIONAL",
    name: "Pro",
    price: 4990,
    period: "mes",
    features: [
      "Hasta 5 profesionales",
      "Turnos ilimitados",
      "Cobros con Mercado Pago",
      "CRM + fidelización",
      "Campañas automatizadas",
      "Widget de reservas",
      "Reportes avanzados",
    ],
    icon: Zap,
    popular: true,
  },
  {
    key: "ENTERPRISE",
    name: "Business",
    price: 9990,
    period: "mes",
    features: [
      "Profesionales ilimitados",
      "Todo lo de Pro",
      "Multi-sucursal",
      "Marca blanca",
      "Soporte prioritario",
    ],
    icon: Crown,
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  AUTHORIZED: { label: "Activa", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  PENDING: { label: "Pendiente", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PAUSED: { label: "Pausada", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  CANCELLED: { label: "Cancelada", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  EXPIRED: { label: "Expirada", color: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function formatPrice(amount: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(amount);
}

export default function SubscriptionPage() {
  const searchParams = useSearchParams();
  const isCallback = searchParams.get("result") === "callback";
  const { data, isLoading, mutate } = useSWR("/api/panel/subscription");
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // Poll on callback until subscription is AUTHORIZED
  useEffect(() => {
    if (!isCallback) return;
    const interval = setInterval(() => {
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
    if (!confirm("¿Estás seguro de cancelar tu suscripción? Mantendrás el acceso hasta el fin del período actual.")) return;
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

  const currentPlan = data?.plan || "STARTER";
  const usage = data?.usage;
  const subscription = data?.subscription;
  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Suscripción</h1>
        <p className="text-muted-foreground text-sm mt-1">Administrá tu plan y facturación</p>
      </div>

      {/* Current plan + status */}
      <div className="glass rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-heading font-semibold">
                Plan {currentPlan === "PROFESSIONAL" ? "Pro" : currentPlan === "ENTERPRISE" ? "Business" : "Starter"}
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
              onClick={handleCancel}
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
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key && subscription?.status === "AUTHORIZED";
          const showSubscribe = !isCurrent && (
            plan.key === "ENTERPRISE"
              ? currentPlan !== "ENTERPRISE"
              : currentPlan === "STARTER"
          );
          const PlanIcon = plan.icon;

          return (
            <div
              key={plan.key}
              className={`glass rounded-xl p-6 flex flex-col ${
                plan.popular ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.popular && (
                <div className="text-xs font-medium text-primary mb-2">Más popular</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <PlanIcon className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-semibold text-lg">{plan.name}</h3>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-heading font-bold">{formatPrice(plan.price)}</span>
                <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Prueba gratis por 14 días vía MercadoPago</p>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
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
                <th className="text-center px-4 py-3 font-medium text-primary">Pro</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Business</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Profesionales", pro: "5", ent: "Ilimitados", icon: Users },
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
