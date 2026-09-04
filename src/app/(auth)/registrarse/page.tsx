import type { Metadata } from "next";
import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { TRIAL_DAYS } from "@/lib/subscription/access";

export const metadata: Metadata = {
  title: "Crear una cuenta",
};

export default function RegisterPage() {
  return (
    <AuthShell
      title="Empezá tu prueba"
      subtitle={`${TRIAL_DAYS} días con todo desbloqueado, sin tarjeta.`}
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/iniciar-sesion" className="font-semibold text-jade-link hover:underline">
            Entrá a tu panel
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
