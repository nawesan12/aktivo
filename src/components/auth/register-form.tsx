"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerUser } from "@/app/(auth)/registrarse/actions";

import { authField, authLabel } from "./auth-shell";

const FIELDS = [
  { name: "name", label: "Tu nombre", type: "text", placeholder: "Martín Gómez", autoComplete: "name" },
  { name: "businessName", label: "Tu negocio", type: "text", placeholder: "Studio Martín", autoComplete: "organization" },
  { name: "email", label: "Email", type: "email", placeholder: "tu@email.com", autoComplete: "email" },
  { name: "password", label: "Contraseña", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Repetí la contraseña", type: "password", placeholder: "••••••••", autoComplete: "new-password" },
] as const;

export function RegisterForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(data: RegisterInput) {
    const result = await registerUser(data);

    if (!result.success) {
      toast.error(result.error || "No pudimos crear la cuenta");
      return;
    }

    toast.success("Listo, tu cuenta está creada.");
    router.push("/panel/bienvenida");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label htmlFor={field.name} className={authLabel}>
            {field.label}
          </label>
          <input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            className={authField}
            aria-invalid={Boolean(errors[field.name])}
            {...register(field.name)}
          />
          {errors[field.name] && (
            <p className="mt-1 text-xs text-danger-foreground">{errors[field.name]?.message}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] disabled:opacity-50"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Crear mi cuenta
      </button>
    </form>
  );
}
