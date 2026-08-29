import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:expire-bookings");

/**
 * Cancels bookings that were never paid.
 *
 * A PENDING_PAYMENT booking holds its slot (see OCCUPYING_STATUSES in
 * availability-engine). Without this job, anyone could fill a business's whole
 * agenda by creating bookings and never paying — no account needed, since guest
 * booking is public.
 *
 * `getAvailableSlots` already ignores expired holds, so the slot is free the
 * moment `expiresAt` passes; this job is what keeps the data itself clean and
 * the agenda view honest.
 */
export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const now = new Date();

    const expired = await db.appointment.findMany({
      where: {
        status: "PENDING_PAYMENT",
        expiresAt: { not: null, lte: now },
      },
      select: { id: true, businessId: true },
      take: 500,
    });

    if (expired.length === 0) {
      return NextResponse.json({ expired: 0 });
    }

    const ids = expired.map((a) => a.id);

    await db.$transaction([
      db.appointment.updateMany({
        where: { id: { in: ids } },
        data: { status: "CANCELLED", expiresAt: null },
      }),
      // The pending payment goes with it, so it doesn't linger as a debt.
      db.payment.updateMany({
        where: { appointmentId: { in: ids }, status: "PENDING" },
        data: { status: "CANCELLED" },
      }),
    ]);

    log.info("released unpaid bookings", { count: ids.length });

    return NextResponse.json({ expired: ids.length });
  } catch (error) {
    return handleApiError(error);
  }
}
