"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { JikuLogo } from "@/components/brand/jiku-logo";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerUser } from "./actions";

export default function RegisterPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    const result = await registerUser(data);

    if (!result.success) {
      toast.error(result.error || "Error al crear la cuenta");
      return;
    }

    toast.success("Cuenta creada exitosamente");
    router.push("/panel/bienvenida");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <JikuLogo size="md" />
          </Link>
          <h1 className="text-2xl font-heading font-bold">Crea tu cuenta</h1>
          <p className="text-muted-foreground text-sm mt-1">Empezá a gestionar tu negocio</p>
        </div>
        <div className="glass rounded-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium mb-1.5 block">Nombre</label>
              <input
                id="name"
                {...register("name")}
                type="text"
                placeholder="Tu nombre"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.name && (
                <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="businessName" className="text-sm font-medium mb-1.5 block">Nombre del negocio</label>
              <input
                id="businessName"
                {...register("businessName")}
                type="text"
                placeholder="Ej: Barberia Don Lucas"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.businessName && (
                <p className="text-xs text-destructive mt-1">{errors.businessName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</label>
              <input
                id="email"
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
              <label htmlFor="password" className="text-sm font-medium mb-1.5 block">Contraseña</label>
              <input
                id="password"
                {...register("password")}
                type="password"
                placeholder="********"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.password && (
                <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                {...register("confirmPassword")}
                type="password"
                placeholder="********"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Crear cuenta
            </button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            Ya tenés cuenta?{" "}
            <Link href="/iniciar-sesion" className="text-primary hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
