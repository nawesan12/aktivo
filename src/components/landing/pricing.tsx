import Link from "next/link";
import { Check } from "lucide-react";

import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES } from "@/lib/subscription/config";
import { TRIAL_DAYS } from "@/lib/subscription/access";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

import { Section, SectionEyebrow, SectionTitle } from "./section";

const inicial = PLAN_LIMITS.PROFESSIONAL;

/**
 * Two plans, priced from the same constants the checkout charges.
 *
 * The limits are interpolated rather than written out, so a change to
 * PLAN_LIMITS cannot leave the landing advertising a ceiling the code no longer
 * enforces — which is exactly what had happened to the FAQ structured data,
 * still promising unlimited turnos on a plan capped at 300.
 */
const PLANS = [
  {
    key: "PROFESSIONAL" as const,
    featured: true,
    pitch: "Para un local que quiere dejar la libreta atrás.",
    features: [
      `Hasta ${inicial.maxStaff} profesionales`,
      `${inicial.maxAppointmentsPerMonth} turnos por mes`,
      "Cobros con Mercado Pago",
      "Ficha de cada cliente",
      "Reseñas de tus clientes",
    ],
  },
  {
    key: "ENTERPRISE" as const,
    featured: false,
    pitch: "Para el local que ya trabaja lleno y quiere un mes previsible.",
    features: [
      "Membresías: cobrales un abono mensual",
      "Cupones y referidos para traerlos de vuelta",
      "Turnos y profesionales sin tope",
      "Reportes avanzados",
      "Varias sucursales y marca blanca",
    ],
  },
];

export function Pricing() {
  return (
    <Section id="planes" ground="card" className="py-14 text-center lg:py-[72px]">
      <SectionEyebrow>Planes</SectionEyebrow>
      <SectionTitle className="mb-2">Simple. Transparente. Sin letra chica.</SectionTitle>
      <p className="mb-10 text-sm text-muted-foreground">
        {TRIAL_DAYS} días gratis con todo desbloqueado y sin tarjeta. Después elegís.
      </p>

      <div className="mx-auto grid max-w-[720px] gap-3.5 text-left sm:grid-cols-2">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={cn(
              "relative rounded-2xl bg-card p-8",
              plan.featured
                ? "border-2 border-primary shadow-[0_16px_40px_-16px_rgba(74,222,128,0.4)]"
                : "border border-border"
            )}
          >
            {plan.featured && (
              <span className="absolute -top-[11px] left-6 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.05em] text-primary-foreground">
                Recomendado
              </span>
            )}

            <p className="mb-2.5 text-[13px] font-bold">{PLAN_NAMES[plan.key]}</p>
            <p className="mb-1.5 flex items-baseline gap-1">
              <span className="text-[40px] font-extrabold tracking-[-0.04em]">
                {formatCurrency(PLAN_PRICES[plan.key].amount)}
              </span>
              <span className="text-xs text-muted-foreground">/mes</span>
            </p>
            <p className="mb-4 text-[11px] text-faint">
              {PLAN_PRICES[plan.key].currency} · Facturación mensual
            </p>
            <p className="mb-[18px] text-[12.5px] text-muted-foreground">{plan.pitch}</p>

            <ul className="mb-6 flex flex-col gap-[9px] text-[13px] text-muted-foreground">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-jade-label" strokeWidth={3} />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/registrarse"
              className={cn(
                "block rounded-[10px] py-[13px] text-center text-[13.5px] transition-colors",
                plan.featured
                  ? "bg-primary font-bold text-primary-foreground hover:bg-[#22c55e]"
                  : "border border-border font-semibold hover:border-faint"
              )}
            >
              Probar gratis
            </Link>
          </div>
        ))}
      </div>
    </Section>
  );
}
