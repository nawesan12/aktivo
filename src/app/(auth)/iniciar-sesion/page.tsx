"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations";

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Credenciales invalidas");
      return;
    }

    router.push("/panel");
  }

  function handleGoogle() {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: "/panel" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <JikuLogo size="md" />
          </Link>
          <h1 className="text-2xl font-heading font-bold">Bienvenido de vuelta</h1>
          <p className="text-muted-foreground text-sm mt-1">Ingresa a tu cuenta</p>
        </div>
        <div className="glass rounded-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                {...register("email")}
                type="email"
                placeholder="tu@email.com"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.email && (
                <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Contrasena</label>
              <input
                {...register("password")}
                type="password"
                placeholder="********"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end">
              <Link href="/recuperar-contrasena" className="text-xs text-primary hover:underline">
                Olvidaste tu contrasena?
              </Link>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Iniciar sesion
            </button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">o continua con</span>
            </div>
          </div>
          <button
            onClick={handleGoogle}
            disabled={isGoogleLoading}
            className="w-full h-10 rounded-lg border border-border bg-muted/30 text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isGoogleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Google
          </button>
          <p className="text-center text-sm text-muted-foreground">
            No tenes cuenta?{" "}
            <Link href="/registrarse" className="text-primary hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
