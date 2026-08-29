import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { getAvailableDates } from "@/lib/availability";
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
    const duration = searchParams.get("duration");

    if (!staffId) {
      return NextResponse.json({ error: "staffId es requerido" }, { status: 400 });
    }

    const maxDays = business.settings?.maxAdvanceDays ?? 30;
    const serviceDuration = duration ? parseInt(duration) : undefined;

    // A single batch of queries covers the whole range; when the duration is known,
    // occupancy per day is computed in memory.
    const dates = await getAvailableDates({
      businessId: business.id,
      staffId,
      daysAhead: maxDays,
      ...(serviceDuration && Number.isFinite(serviceDuration)
        ? {
            serviceDuration,
            slotInterval: business.settings?.slotInterval ?? 30,
            minHoursAdvance: business.settings?.minAdvanceHours ?? 2,
            bufferMinutes: business.settings?.bufferMinutes ?? 0,
          }
        : {}),
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
