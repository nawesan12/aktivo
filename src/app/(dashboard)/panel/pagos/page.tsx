import type { Metadata } from "next";
import { PaymentConfig } from "@/components/dashboard/payment-config";

export const metadata: Metadata = {
  title: "Pagos",
};

export default function PagosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Pagos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configuración de pagos y MercadoPago
        </p>
      </div>
      <PaymentConfig />
    </div>
  );
}
