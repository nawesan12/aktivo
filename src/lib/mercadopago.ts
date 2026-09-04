import { MercadoPagoConfig, Preference, Payment, PaymentRefund } from "mercadopago";
import { db } from "@/lib/db";
import { decryptSecret } from "@/lib/crypto";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("mercadopago");

function clientFor(accessToken: string) {
  const client = new MercadoPagoConfig({ accessToken });
  return {
    preference: new Preference(client),
    payment: new Payment(client),
    refund: new PaymentRefund(client),
  };
}

/**
 * A client for a specific access token.
 *
 * The token is required. It used to be optional and fall back to Jiku's own
 * platform token — which meant a business whose stored credential could not be
 * decrypted had its customers' money collected into Jiku's account, silently.
 * Rotating `ENCRYPTION_KEY` was enough to do that to every business at once.
 */
export function getMPClient(accessToken: string) {
  return clientFor(accessToken);
}

/**
 * A client on Jiku's own account. Only for what belongs to the platform, never
 * for collecting on behalf of a business.
 */
export function getPlatformMPClient() {
  const token = env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN no está configurado");
  }
  return clientFor(token);
}

// calculatePaymentAmount lives in ./pricing (pure, unit-tested). Re-exported
// here because callers historically imported it from this module.
export { calculatePaymentAmount } from "./pricing";

/**
 * How a business stands with MercadoPago.
 *
 * Four ways of not being able to charge, deliberately kept apart: never
 * connected, connected but the stored credential is unreadable, connected but
 * expired, and connected but the last renewal failed. They all mean "no charge"
 * to the booking path and completely different things to the owner, who needs
 * to be told which one it is.
 */
export type BusinessMPConnection =
  | { status: "none" }
  | { status: "broken" }
  | { status: "expired"; expiresAt: Date }
  | {
      status: "ok";
      accessToken: string;
      mpUserId: string | null;
      expiresAt: Date | null;
    };

export async function getBusinessMPConnection(
  businessId: string
): Promise<BusinessMPConnection> {
  const account = await db.mercadoPagoAccount.findUnique({ where: { businessId } });

  if (account) {
    if (account.expiresAt && account.expiresAt.getTime() <= Date.now()) {
      return { status: "expired", expiresAt: account.expiresAt };
    }

    try {
      return {
        status: "ok",
        accessToken: decryptSecret(account.accessToken),
        mpUserId: account.mpUserId,
        expiresAt: account.expiresAt,
      };
    } catch (error) {
      log.error("could not decrypt the linked account", error, { businessId });
      return { status: "broken" };
    }
  }

  // Tokens pasted into the old form, before the account could be linked. Kept
  // working so nobody loses the ability to charge on the day this ships.
  const legacy = await db.businessConfig.findUnique({
    where: { businessId_key: { businessId, key: "mp_access_token" } },
  });

  if (!legacy?.value) return { status: "none" };

  try {
    return {
      status: "ok",
      accessToken: decryptSecret(legacy.value),
      mpUserId: null,
      expiresAt: null,
    };
  } catch (error) {
    // Never fall through to the platform token here: a broken credential is a
    // reason to stop, not a reason to charge somebody else's account.
    log.error("could not decrypt stored token", error, { businessId });
    return { status: "broken" };
  }
}

/** The token to charge with, or null when the business cannot charge. */
export async function getBusinessMPToken(businessId: string): Promise<string | null> {
  const connection = await getBusinessMPConnection(businessId);
  return connection.status === "ok" ? connection.accessToken : null;
}

/**
 * The business behind a MercadoPago seller id.
 *
 * This is how a webhook finds its business. The first notification for a
 * payment arrives before we have stored its payment id, so there is nothing
 * else to match on — and without a business there is no token to query
 * MercadoPago with, which is why those notifications used to be dropped.
 */
export async function getBusinessByMPUserId(mpUserId: string): Promise<string | null> {
  const account = await db.mercadoPagoAccount.findUnique({
    where: { mpUserId },
    select: { businessId: true },
  });

  return account?.businessId ?? null;
}
