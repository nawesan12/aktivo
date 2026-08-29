import { timingSafeEqual } from "crypto";
import { AuthError } from "@/lib/api-errors";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron");

/**
 * Authenticates a scheduled job request.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. The secret travels in
 * a header rather than the query string, where it would end up in access logs,
 * browser history and Referer headers.
 *
 * `REMINDERS_SECRET` is accepted as a legacy name so existing configuration
 * keeps working.
 */
export function assertCronRequest(request: Request): void {
  const secret = env.CRON_SECRET || env.REMINDERS_SECRET;

  if (!secret) {
    // Fail closed: an unauthenticated job endpoint can send messages to every
    // customer of every business.
    log.error("CRON_SECRET is not set — rejecting request");
    throw new AuthError("Cron no configurado");
  }

  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  const headerBuf = Buffer.from(header, "utf8");
  const expectedBuf = Buffer.from(expected, "utf8");

  if (headerBuf.length !== expectedBuf.length || !timingSafeEqual(headerBuf, expectedBuf)) {
    throw new AuthError();
  }
}
