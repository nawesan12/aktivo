import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("mercadopago");

/**
 * Get a MercadoPago client for a specific business.
 * Uses platform-wide token by default.
 * In PROFESSIONAL+, can use business-specific token.
 */
export function getMPClient(accessToken?: string) {
  const token = accessToken || env.MERCADOPAGO_ACCESS_TOKEN!;
  const client = new MercadoPagoConfig({ accessToken: token });
  return {
    preference: new Preference(client),
    payment: new Payment(client),
    refund: new PaymentRefund(client),
  };
}

// calculatePaymentAmount lives in ./pricing (pure, unit-tested). Re-exported
// here because callers historically imported it from this module.
export { calculatePaymentAmount } from "./pricing";

/**
 * The business's own MercadoPago access token, decrypted, or undefined when it
 * hasn't configured one (the platform token is used then).
 *
 * Stored encrypted in BusinessConfig — read it through here, never directly.
 */
export async function getBusinessMPToken(businessId: string): Promise<string | undefined> {
  const config = await db.businessConfig.findUnique({
    where: { businessId_key: { businessId, key: "mp_access_token" } },
  });

  if (!config?.value) return undefined;

  try {
    return decryptSecret(config.value);
  } catch (error) {
    log.error("could not decrypt stored token", error, { businessId });
    return undefined;
  }
}
