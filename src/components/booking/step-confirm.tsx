"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useSession } from "next-auth/react";
import { useBookingStore } from "@/stores/booking-store";
import { MagneticButton } from "@/components/premium/magnetic-button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CreditCard,
  FileText,
  Loader2,
  Sparkles,
} from "lucide-react";

interface PaymentConfig {
  paymentMode: "DISABLED" | "FULL" | "PERCENTAGE" | "FIXED";
  depositPercentage: number | null;
  depositFixedAmount: number | null;
  currency: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function getPaymentAmount(price: number, config: PaymentConfig): number {
  switch (config.paymentMode) {
    case "FULL":
      return price;
    case "PERCENTAGE":
      return Math.round(price * ((config.depositPercentage || 50) / 100));
    case "FIXED":
      return Math.min(config.depositFixedAmount || 0, price);
    default:
      return 0;
  }
}

function getPaymentLabel(config: PaymentConfig): string {
  switch (config.paymentMode) {
    case "FULL":
      return "Pago total requerido";
    case "PERCENTAGE":
      return `Seña del ${config.depositPercentage}%`;
    case "FIXED":
      return "Seña fija requerida";
    default:
      return "";
  }
}

export function StepConfirm({ slug }: { slug: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const store = useBookingStore();
  const [submitting, setSubmitting] = useState(false);

  const { data: paymentConfig, isLoading: loadingPayment } = useSWR<PaymentConfig>(
    `/api/businesses/${slug}/payment-config`
  );

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        serviceId: store.serviceId,
        staffId: store.staffId,
        dateTime: `${store.date}T${store.time}`,
        notes: store.notes || undefined,
      };

      if (!session?.user) {
        body.guest = {
          name: store.guestName,
          phone: store.guestPhone,
          email: store.guestEmail || undefined,
        };
      }

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Error al crear el turno");
        setSubmitting(false);
        return;
      }

      // If payment URL, redirect to MercadoPago
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      // Otherwise go to confirmation page
      router.push(`/${slug}/reservar/confirmacion?appointmentId=${data.id}`);
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
      setSubmitting(false);
    }
  };

  const paymentAmount = paymentConfig && store.servicePrice
    ? getPaymentAmount(store.servicePrice, paymentConfig)
    : 0;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Confirmar turno</h2>
      <p className="text-sm text-muted-foreground mb-6">Revisa los detalles antes de confirmar</p>

      {/* Summary card */}
      <div className="glass rounded-xl p-6 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Servicio</p>
            <p className="font-medium text-sm">{store.serviceName}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-heading font-bold brand-text">{store.servicePrice ? formatPrice(store.servicePrice) : "-"}</p>
            <p className="text-[10px] text-muted-foreground">{store.serviceDuration ? formatDuration(store.serviceDuration) : ""}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Profesional</p>
            <p className="font-medium text-sm">{store.staffName}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Fecha y hora</p>
            <p className="font-medium text-sm">{format(parseISO(store.date), "EEEE d 'de' MMMM", { locale: es })} a las {store.time}</p>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium text-sm">{store.guestName}</p>
            <p className="text-xs text-muted-foreground">{store.guestPhone}{store.guestEmail ? ` · ${store.guestEmail}` : ""}</p>
          </div>
        </div>

        {store.notes && (
          <>
            <div className="border-t border-border" />
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notas</p>
                <p className="text-sm text-foreground/80">{store.notes}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment section */}
      {loadingPayment ? (
        <Skeleton className="h-20 rounded-xl mb-6" />
      ) : (
        paymentConfig && paymentConfig.paymentMode !== "DISABLED" && (
          <div className="glass rounded-xl p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{getPaymentLabel(paymentConfig)}</p>
                <p className="text-xs text-muted-foreground">
                  Se procesará vía MercadoPago
                </p>
              </div>
              <span className="text-lg font-heading font-bold brand-text">
                {formatPrice(paymentAmount)}
              </span>
            </div>
          </div>
        )
      )}

      {/* Cancellation policy */}
      <p className="text-xs text-muted-foreground text-center mb-6">
        Podes cancelar tu turno hasta 24 horas antes sin cargo.
      </p>

      {/* Confirm button */}
      <div className="flex justify-center">
        <MagneticButton
          className="brand-gradient text-white px-8 py-3.5 rounded-xl font-medium text-lg inline-flex items-center gap-2.5 glow-primary cursor-pointer disabled:opacity-50"
          onClick={handleConfirm}
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Confirmar turno
            </>
          )}
        </MagneticButton>
      </div>
    </div>
  );
}
