"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { JikuLogo } from "@/components/brand/jiku-logo";

function RecoverContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return token ? <ResetForm token={token} /> : <ForgotForm />;
}

export default function RecoverPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <JikuLogo size="md" />
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="glass rounded-2xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          <RecoverContent />
        </Suspense>
      </div>
    </div>
  );
}

function ForgotForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-xl font-heading font-bold mb-2">Email enviado</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Si existe una cuenta con ese email, recibiras un enlace para restablecer tu contraseña.
        </p>
        <Link
          href="/iniciar-sesión"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold">Recuperar contraseña</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Enviar enlace
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/iniciar-sesión" className="text-primary hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </div>
  );
}

function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Contrasena actualizada correctamente");
      router.push("/iniciar-sesión");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restablecer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div>
        <h1 className="text-xl font-heading font-bold">Nueva contraseña</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ingresa tu nueva contraseña.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Nueva contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
            minLength={6}
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            required
            minLength={6}
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Restablecer contraseña
        </button>
      </form>
    </div>
  );
}
