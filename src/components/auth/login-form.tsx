"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { loginSchema, type LoginInput } from "@/lib/validations";

import { authField, authLabel } from "./auth-shell";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/panel";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginInput) {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Ese email y esa contraseña no coinciden con ninguna cuenta.");
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <label htmlFor="email" className={authLabel}>
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          className={authField}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-xs text-danger-foreground">{errors.email.message}</p>}

        <div className="mb-[7px] mt-[18px] flex items-baseline justify-between">
          <label htmlFor="password" className="text-[12.5px] font-semibold">
            Contraseña
          </label>
          <Link href="/recuperar-contrasena" className="text-xs text-jade-link hover:underline">
            ¿La olvidaste?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          className={authField}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-danger-foreground">{errors.password.message}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-[26px] flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          Entrar al panel
        </button>
      </form>

      {/*
        Only when the provider is actually registered. Without the client id and
        secret, next-auth does not mount Google at all and the button led to
        `invalid_client` — a dead end with Google's own error page at the end of it.
      */}
      {googleEnabled && (
        <>
          <div className="my-[22px] flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-faint">o</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full rounded-[10px] border border-border bg-card py-[13px] text-[13px] font-semibold transition-colors hover:border-faint"
          >
            Continuar con Google
          </button>
        </>
      )}
    </>
  );
}
