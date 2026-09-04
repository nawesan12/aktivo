import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { getAvailableSlots, getAnyStaffSlots } from "@/lib/availability";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { parseDateInArgentina } from "@/lib/timezone";

/**
 * Free times for the owner booking into their own agenda.
 *
 * Separate from the public `/availability/slots` because the rules differ in
 * one place that matters: the minimum notice. It exists so a customer cannot
 * book for five minutes from now, and applying it here would stop the barber
 * writing down the person already in the chair.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:read");

    const { searchParams } = request.nextUrl;
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");
    const dateParam = searchParams.get("date");

    if (!serviceId || !staffId || !dateParam) {
      return NextResponse.json({ data: [] });
    }

    const service = await db.service.findFirst({
      where: { id: serviceId, businessId: session.businessId, isActive: true },
      select: { duration: true },
    });

    if (!service) throw new NotFoundError("Servicio no encontrado");

    const settings = await db.businessSettings.findUnique({
      where: { businessId: session.businessId },
      select: { slotInterval: true, bufferMinutes: true },
    });

    // Same reason as the booking route: an expired unpaid hold still occupies
    // the slot in the database, so without this it would read as taken forever.
    await releaseExpiredHolds({ businessId: session.businessId });

    const options = {
      businessId: session.businessId,
      // Midnight at the business. `new Date("2026-09-04")` is the previous day
      // in Argentina.
      date: parseDateInArgentina(dateParam),
      serviceDuration: service.duration,
      slotInterval: settings?.slotInterval ?? 30,
      minHoursAdvance: 0,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    };

    const slots =
      staffId === "any"
        ? await getAnyStaffSlots({ ...options, serviceId })
        : await getAvailableSlots({ ...options, staffId });

    return NextResponse.json({
      data: slots
        .filter((slot) => slot.available)
        .map((slot) => ({ time: slot.display, iso: slot.time.toISOString() })),
    });
  } catch (error) {
    return handleApiError(error, "panel:availability");
  }
}
