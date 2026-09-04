import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { refreshAccount } from "@/lib/mercadopago-oauth";
import { sendMercadoPagoLinkExpiring } from "@/lib/notifications/mercadopago-email";

const log = createLogger("mercadopago:renewal");

/**
 * How far ahead a link is renewed. MercadoPago tokens live 180 days, so a month
 * of runway leaves plenty of room for a few failed attempts before anybody
 * notices anything.
 */
const RENEW_WITHIN_DAYS = 30;

/** Renewals attempted per pass, so one run cannot go long. */
const BATCH_SIZE = 20;

export interface RenewalResult {
  considered: number;
  renewed: number;
  failed: number;
}

/**
 * Renews MercadoPago links before they lapse.
 *
 * Without this every business stops being able to charge exactly six months
 * after connecting — on a Tuesday, with a customer at the counter, and with no
 * warning of any kind. When a renewal fails the owner is emailed, because the
 * fix (re-linking) is something only they can do.
 */
export async function renewMercadoPagoLinks(): Promise<RenewalResult> {
  const deadline = new Date(Date.now() + RENEW_WITHIN_DAYS * 86_400_000);

  const due = await db.mercadoPagoAccount.findMany({
    where: { expiresAt: { not: null, lte: deadline } },
    select: {
      businessId: true,
      expiresAt: true,
      lastError: true,
      business: { select: { name: true, slug: true, email: true } },
    },
    orderBy: { expiresAt: "asc" },
    take: BATCH_SIZE,
  });

  let renewed = 0;
  let failed = 0;

  for (const account of due) {
    try {
      await refreshAccount(account.businessId);
      renewed++;
    } catch (error) {
      failed++;

      log.error("could not renew the link", error, {
        businessId: account.businessId,
        expiresAt: account.expiresAt,
      });

      // Told once, not on every pass: the job runs repeatedly and nobody needs
      // the same warning every half hour.
      if (!account.lastError && account.business.email) {
        await sendMercadoPagoLinkExpiring({
          to: account.business.email,
          businessName: account.business.name,
          businessSlug: account.business.slug,
          expiresAt: account.expiresAt,
        }).catch((sendError) =>
          log.error("could not warn the owner", sendError, {
            businessId: account.businessId,
          })
        );
      }
    }
  }

  return { considered: due.length, renewed, failed };
}
