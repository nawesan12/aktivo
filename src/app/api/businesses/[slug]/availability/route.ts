import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { getAvailableDates, getAnyStaffDates } from "@/lib/availability";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await resolveBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const serviceId = searchParams.get("serviceId");
    const duration = searchParams.get("duration");

    if (!staffId) {
      return NextResponse.json({ error: "staffId es requerido" }, { status: 400 });
    }

    const maxDays = business.settings?.maxAdvanceDays ?? 30;
    const serviceDuration = duration ? parseInt(duration) : undefined;

    const occupancy =
      serviceDuration && Number.isFinite(serviceDuration)
        ? {
            serviceDuration,
            slotInterval: business.settings?.slotInterval ?? 30,
            minHoursAdvance: business.settings?.minAdvanceHours ?? 2,
            bufferMinutes: business.settings?.bufferMinutes ?? 0,
          }
        : {};

    // A single batch of queries covers the whole range; when the duration is known,
    // occupancy per day is computed in memory.
    //
    // With "cualquier profesional" the calendar has to mark a day as open when
    // *anyone* has room, otherwise the customer is shown a month of grey days
    // because the first barber is booked solid.
    const dates =
      staffId === "any" && serviceId
        ? await getAnyStaffDates({
            businessId: business.id,
            serviceId,
            daysAhead: maxDays,
            ...occupancy,
          })
        : await getAvailableDates({
            businessId: business.id,
            staffId,
            daysAhead: maxDays,
            ...occupancy,
          });

    return NextResponse.json(
      dates.map((d) => ({
        date: d.date.toISOString(),
        hasSlots: d.hasSlots,
        slotCount: d.slotCount,
      }))
    );
  } catch (error) {
    return handleApiError(error, "businesses:slug:availability");
  }
}
