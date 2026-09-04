import type { Metadata } from "next";
import { Suspense } from "react";

import { getSessionBusiness } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { PanelHeader } from "@/components/dashboard/panel-header";
import { PaymentsOverview } from "@/components/dashboard/payments-overview";
import { PaymentConfig } from "@/components/dashboard/payment-config";
import { MercadoPagoConnection } from "@/components/dashboard/mercadopago-connection";

export const metadata: Metadata = {
  title: "Pagos",
};

function depositLabel(mode: string | undefined, percentage: number | null, fixed: number | null) {
  if (mode === "FULL") return "Total";
  if (mode === "PERCENTAGE") return `${percentage ?? 50}%`;
  if (mode === "FIXED") return `$${(fixed ?? 0).toLocaleString("es-AR")}`;
  return "Sin seña";
}

export default async function PagosPage() {
  const session = await getSessionBusiness();
  const settings = await db.businessSettings.findUnique({
    where: { businessId: session.businessId },
    select: { paymentMode: true, depositPercentage: true, depositFixedAmount: true },
  });

  return (
    <div>
      <PanelHeader title="Pagos" subtitle="Señas y cobros directo a tu Mercado Pago" />

      <PaymentsOverview
        depositLabel={depositLabel(
          settings?.paymentMode,
          settings?.depositPercentage ?? null,
          settings?.depositFixedAmount ?? null
        )}
      />

      <div id="config-seña" className="mt-3.5 space-y-3.5 scroll-mt-6">
        {/* Reads `?mp=` with useSearchParams to report how the link went. */}
        <Suspense fallback={null}>
          <MercadoPagoConnection />
        </Suspense>
        <PaymentConfig />
      </div>
    </div>
  );
}
