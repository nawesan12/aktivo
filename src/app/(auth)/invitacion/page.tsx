"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { JikuLogo } from "@/components/brand/jiku-logo";

function InvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "register" | "error">("loading");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch("/api/team/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          toast.success("Invitacion aceptada");
        } else if (data.needsRegistration) {
          setStatus("register");
          setEmail(data.email);
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="glass rounded-2xl p-8">
      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Procesando invitacion...</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
          <h2 className="text-xl font-heading font-bold">Invitacion aceptada</h2>
          <p className="text-muted-foreground text-sm">
            Ya podes acceder al panel del negocio.
          </p>
          <button
            onClick={() => router.push("/iniciar-sesion")}
            className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm"
          >
            Iniciar sesion
          </button>
        </div>
      )}

      {status === "register" && (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-heading font-bold">Crea tu cuenta</h2>
          <p className="text-muted-foreground text-sm">
            Necesitas una cuenta para aceptar la invitacion.
          </p>
          <button
            onClick={() => router.push(`/registrarse?email=${encodeURIComponent(email)}`)}
            className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm"
          >
            Registrarse
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-heading font-bold">Invitacion invalida</h2>
          <p className="text-muted-foreground text-sm">
            Este enlace es invalido o ya expiro.
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Volver al inicio
          </Link>
        </div>
      )}
    </div>
  );
}

export default function InvitationPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="inline-flex">
            <JikuLogo size="md" />
          </Link>
        </div>

        <Suspense
          fallback={
            <div className="glass rounded-2xl p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Cargando...</p>
            </div>
          }
        >
          <InvitationContent />
        </Suspense>
      </div>
    </div>
  );
}
