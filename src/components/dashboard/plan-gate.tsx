"use client";

import Link from "next/link";
import useSWR from "swr";
import { Lock } from "lucide-react";
import type { BusinessPlan } from "@/generated/prisma/client";
import { PLAN_NAMES, PLAN_PRICES, isAtLeast } from "@/lib/subscription/config";
import { formatCurrency } from "@/lib/format";

interface PlanGateProps {
  feature: string;
  requiredPlan: Exclude<BusinessPlan, "STARTER">;
  children: React.ReactNode;
}

/**
 * Says "this needs a bigger plan" instead of showing an empty screen.
 *
 * The API already refuses these features — the gated endpoints answer 403 to a
 * business whose plan does not include them — but nothing in the panel read
 * that. The components fell back to `data || {}` and rendered four counters in
 * zero and "no hay datos suficientes". A business paying for the product was
 * being shown, in good faith, that the product was empty.
 */
export function PlanGate({ feature, requiredPlan, children }: PlanGateProps) {
  const { data } = useSWR<{ plan: BusinessPlan }>("/api/panel/access");

  // Until the plan is known, show the content: guessing "locked" would flash a
  // paywall at somebody who has already paid.
  if (!data) return <>{children}</>;
  if (isAtLeast(data.plan, requiredPlan)) return <>{children}</>;

  const price = PLAN_PRICES[requiredPlan];

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl">
        <div className="text-center space-y-3 max-w-sm px-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-lg">{feature}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Está en el plan {PLAN_NAMES[requiredPlan]}
              {price ? `, ${formatCurrency(price.amount)} por mes` : ""}.
            </p>
          </div>
          <Link
            href="/panel/suscripcion"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ver planes
          </Link>
        </div>
      </div>
    </div>
  );
}
