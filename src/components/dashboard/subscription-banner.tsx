"use client";

import Link from "next/link";
import useSWR from "swr";
import { AlertTriangle, Clock } from "lucide-react";

interface Access {
  blocked: boolean;
  trialDaysLeft: number;
  hasSubscription: boolean;
}

/**
 * Says out loud what the API is already enforcing.
 *
 * Without it a blocked business finds out by clicking "save" and getting an
 * error, which reads as a bug rather than as a bill. It sits in the topbar so
 * it shows on every panel page; the endpoint behind it is deliberately tiny.
 */
export function SubscriptionBanner() {
  const { data } = useSWR<Access>("/api/panel/access");

  if (!data) return null;
  if (!data.blocked && (data.hasSubscription || data.trialDaysLeft > 3)) return null;

  if (data.blocked) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 px-4 py-2 bg-danger-muted border-b border-danger/20 text-sm"
      >
        <AlertTriangle className="w-4 h-4 text-danger-foreground shrink-0" />
        <span className="text-danger-foreground">
          Tu prueba terminó. Podés seguir viendo todo, pero no cargar ni
          modificar nada.
        </span>
        <Link
          href="/panel/suscripcion"
          className="ml-auto shrink-0 font-medium underline underline-offset-4 text-danger-foreground"
        >
          Elegir un plan
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 border-b border-primary/20 text-sm">
      <Clock className="w-4 h-4 text-primary shrink-0" />
      <span>
        {data.trialDaysLeft === 1
          ? "Te queda 1 día de prueba."
          : `Te quedan ${data.trialDaysLeft} días de prueba.`}
      </span>
      <Link
        href="/panel/suscripcion"
        className="ml-auto shrink-0 font-medium underline underline-offset-4 text-primary"
      >
        Ver planes
      </Link>
    </div>
  );
}
