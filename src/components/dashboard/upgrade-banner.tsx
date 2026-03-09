"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

interface UpgradeBannerProps {
  plan?: string;
  context?: string;
}

export function UpgradeBanner({ plan, context }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (plan !== "FREE" && plan !== "STARTER")) {
    return null;
  }

  const message = context
    ? `Desbloqueá ${context} y más con el plan Pro.`
    : "Desbloqueá turnos ilimitados, cobros con Mercado Pago y reportes avanzados.";

  return (
    <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
      <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Mejorá tu plan</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
      </div>
      <Link
        href="/panel/suscripcion"
        className="shrink-0 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Ver planes
      </Link>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 p-1 rounded hover:bg-muted/50 text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
