import type { Metadata } from "next";
import { Suspense } from "react";
import { PaymentConfig } from "@/components/dashboard/payment-config";
import { MercadoPagoConnection } from "@/components/dashboard/mercadopago-connection";

export const metadata: Metadata = {
  title: "Pagos",
};

export default function PagosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configuración de pagos y Mercado Pago
        </p>
      </div>
      {/* Reads `?mp=` with useSearchParams to report how the link went. */}
      <Suspense fallback={null}>
        <MercadoPagoConnection />
      </Suspense>
      <PaymentConfig />
    </div>
  );
}
