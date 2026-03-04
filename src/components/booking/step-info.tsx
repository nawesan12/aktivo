"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useBookingStore } from "@/stores/booking-store";
import { guestInfoSchema, type GuestInfoInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, LogIn } from "lucide-react";
import Link from "next/link";

export function StepInfo({ slug }: { slug: string }) {
  const { data: session } = useSession();
  const { guestName, guestPhone, guestEmail, notes, setGuestInfo, setNotes, setStep } = useBookingStore();

  const isLoggedIn = !!session?.user;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestInfoInput>({
    resolver: zodResolver(guestInfoSchema),
    defaultValues: {
      name: guestName || session?.user?.name || "",
      phone: guestPhone || "",
      email: guestEmail || session?.user?.email || "",
    },
  });

  const onSubmit = (data: GuestInfoInput) => {
    setGuestInfo(data.name, data.phone, data.email);
    setStep(4);
  };

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Tus datos</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {isLoggedIn ? "Confirma tus datos de contacto" : "Necesitamos tus datos para confirmar el turno"}
      </p>

      {/* Login suggestion for guests */}
      {!isLoggedIn && (
        <div className="glass rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Tenes cuenta?</p>
            <p className="text-xs text-muted-foreground">Inicia sesion para guardar tu historial de turnos</p>
          </div>
          <Link href="/iniciar-sesion" className="shrink-0">
            <Button variant="outline" size="sm" className="rounded-lg text-xs">
              Ingresar
            </Button>
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
              Nombre completo *
            </Label>
            <Input
              id="name"
              placeholder="Tu nombre"
              {...register("name")}
              className="rounded-lg"
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">
              Telefono *
            </Label>
            <Input
              id="phone"
              placeholder="+54 11 1234-5678"
              {...register("phone")}
              className="rounded-lg"
            />
            {errors.phone && (
              <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
            Email <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@email.com"
            {...register("email")}
            className="rounded-lg"
          />
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="notes" className="text-sm font-medium mb-1.5 block">
            Notas <span className="text-muted-foreground">(opcional)</span>
          </Label>
          <Textarea
            id="notes"
            placeholder="Algo que quieras contarnos..."
            defaultValue={notes || ""}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            className="rounded-lg resize-none h-24"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="brand-gradient text-white border-0 rounded-xl px-6 gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
