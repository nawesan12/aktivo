import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { getAvailableDates, getAvailableSlots } from "@/lib/availability";

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
    const dates = await getAvailableDates(staffId, maxDays);

    // If serviceId and duration provided, compute slot counts per available date
    if (serviceId && duration) {
      const slotInterval = business.settings?.slotInterval ?? 30;
      const minAdvanceHours = business.settings?.minAdvanceHours ?? 2;
      const bufferMinutes = business.settings?.bufferMinutes ?? 0;
      const serviceDuration = parseInt(duration);

      const results = await Promise.all(
        dates.map(async (d) => {
          if (!d.hasSlots) {
            return { date: d.date.toISOString(), hasSlots: false, slotCount: 0 };
          }
          try {
            const slots = await getAvailableSlots({
              businessId: business.id,
              staffId,
              date: d.date,
              serviceDuration,
              slotInterval,
              minHoursAdvance: minAdvanceHours,
              bufferMinutes,
            });
            const availableCount = slots.filter((s) => s.available).length;
            return {
              date: d.date.toISOString(),
              hasSlots: availableCount > 0,
              slotCount: availableCount,
            };
          } catch {
            return { date: d.date.toISOString(), hasSlots: d.hasSlots, slotCount: 0 };
          }
        })
      );

      return NextResponse.json(results);
    }

    return NextResponse.json(
      dates.map((d) => ({
        date: d.date.toISOString(),
        hasSlots: d.hasSlots,
      }))
    );
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
