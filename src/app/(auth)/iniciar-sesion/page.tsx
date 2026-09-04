import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { integrationStatus } from "@/lib/env";
import { TRIAL_DAYS } from "@/lib/subscription/access";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  // Read on the server: whether Google is wired up is configuration, and the
  // browser has no business finding out by clicking a button that fails.
  const { googleAuth } = integrationStatus();

  return (
    <AuthShell
      title="Hola de nuevo"
      subtitle="Entrá a tu panel para ver el día de hoy."
      footer={
        <>
          ¿Todavía no tenés cuenta?{" "}
          <Link href="/registrarse" className="font-semibold text-jade-link hover:underline">
            Probá {TRIAL_DAYS} días gratis
          </Link>
        </>
      }
    >
      {/* The form reads `?callbackUrl=`, which is only known at request time. */}
      <Suspense fallback={null}>
        <LoginForm googleEnabled={googleAuth} />
      </Suspense>
    </AuthShell>
  );
}
