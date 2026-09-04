"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";

function InvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  // Derived at first render: no token means error, no effect needed.
  const [status, setStatus] = useState<"loading" | "success" | "register" | "error">(
    token ? "loading" : "error"
  );
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  /**
   * Creates the account and joins the business in one step.
   *
   * The old flow sent the invitee to /registrarse, which asks for a business
   * name and creates a business — so they ended up owning one of their own and
   * never joined the team that invited them.
   */
  async function createAccount(event: React.FormEvent) {
    event.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/team/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "No pudimos crear la cuenta");

      const signedIn = await signIn("credentials", {
        email: data.email,
        password,
        redirect: false,
      });

      toast.success("Listo, ya sos parte del equipo");
      router.push(signedIn?.error ? "/iniciar-sesion" : "/panel");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos crear la cuenta");
      setCreating(false);
    }
  }

  useEffect(() => {
    if (!token) return;

    fetch("/api/team/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          toast.success("Invitación aceptada");
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
          <CheckCircle className="w-12 h-12 text-success-foreground" />
          <h2 className="text-xl font-heading font-bold">Invitacion aceptada</h2>
          <p className="text-muted-foreground text-sm">
            Ya podés acceder al panel del negocio.
          </p>
          <button
            onClick={() => router.push("/iniciar-sesion")}
            className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm"
          >
            Iniciar sesión
          </button>
        </div>
      )}

      {status === "register" && (
        <form onSubmit={createAccount} className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="text-xl font-heading font-bold">Creá tu cuenta</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Para {email}. Al terminar quedás dentro del equipo.
            </p>
          </div>

          <div>
            <label htmlFor="invite-name" className="text-sm font-medium mb-1.5 block">
              Nombre
            </label>
            <input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="invite-password" className="text-sm font-medium mb-1.5 block">
              Contraseña
            </label>
            <input
              id="invite-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Mínimo {PASSWORD_MIN_LENGTH} caracteres.
            </p>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating && <Loader2 className="w-4 h-4 animate-spin" />}
            Crear cuenta y entrar
          </button>
        </form>
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
