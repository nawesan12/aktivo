"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface PlanGateProps {
  feature: string;
  requiredPlan: "PROFESSIONAL" | "ENTERPRISE";
  currentPlan?: string;
  children: React.ReactNode;
}

export function PlanGate({ feature, requiredPlan, currentPlan, children }: PlanGateProps) {
  const planLabel = requiredPlan === "PROFESSIONAL" ? "Pro" : "Business";

  const isLocked =
    currentPlan === "FREE" ||
    currentPlan === "STARTER" ||
    (requiredPlan === "ENTERPRISE" && currentPlan === "PROFESSIONAL");

  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none">
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
              Esta funcionalidad está disponible en el plan {planLabel}.
            </p>
          </div>
          <Link
            href="/panel/suscripcion"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Mejorar plan
          </Link>
        </div>
      </div>
    </div>
  );
}
