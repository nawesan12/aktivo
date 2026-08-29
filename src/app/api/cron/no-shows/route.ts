import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { recordNoShow } from "@/lib/no-show";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:no-shows");

/**
 * Auto-marks missed appointments as NO_SHOW.
 *
 * Only for businesses that opted in (`BusinessSettings.noShowAutoMark`). An
 * appointment qualifies once it ended more than GRACE_MINUTES ago and nobody
 * marked it completed — the grace period exists so a staff member who closes
 * the appointment a bit late doesn't get their client penalised.
 *
 * Penalties are applied by recordNoShow(), which already knows each business's
 * threshold and block duration.
 */
const GRACE_MINUTES = 120;
const BATCH_SIZE = 200;

export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const cutoff = new Date(Date.now() - GRACE_MINUTES * 60 * 1000);

    const candidates = await db.appointment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        endTime: { lt: cutoff },
        business: { settings: { noShowAutoMark: true } },
      },
      select: {
        id: true,
        businessId: true,
        userId: true,
        guestClientId: true,
      },
      orderBy: { endTime: "asc" },
      take: BATCH_SIZE,
    });

    let marked = 0;
    let penalized = 0;

    for (const appointment of candidates) {
      try {
        const result = await recordNoShow({
          businessId: appointment.businessId,
          appointmentId: appointment.id,
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
        });
        marked++;
        if (result.penalized) penalized++;
      } catch (error) {
        log.error("could not mark as no-show", error, { appointmentId: appointment.id });
      }
    }

    return NextResponse.json({
      marked,
      penalized,
      saturated: candidates.length === BATCH_SIZE,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
