import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";

/**
 * Get a MercadoPago client for a specific business.
 * In FREE plan, uses platform-wide token.
 * In PROFESSIONAL+, uses business-specific token.
 */
export function getMPClient(accessToken?: string) {
  const token = accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN!;
  const client = new MercadoPagoConfig({ accessToken: token });
  return {
    preference: new Preference(client),
    payment: new Payment(client),
    refund: new PaymentRefund(client),
  };
}

export function calculatePaymentAmount(
  servicePrice: number,
  mode: "FULL" | "PERCENTAGE" | "FIXED",
  depositPercentage?: number | null,
  depositFixedAmount?: number | null
): number {
  switch (mode) {
    case "FULL":
      return servicePrice;
    case "PERCENTAGE":
      return Math.round(servicePrice * ((depositPercentage || 50) / 100));
    case "FIXED":
      return Math.min(depositFixedAmount || 0, servicePrice);
    default:
      return servicePrice;
  }
}
