import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { getAvailableSlots } from "@/lib/availability";
import { parseDateInArgentina } from "@/lib/timezone";
import { handleApiError } from "@/lib/api-errors";
import { runInBackground } from "@/lib/background";
import { maybeTick } from "@/lib/jobs/tick";

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
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");
    const duration = searchParams.get("duration");

    if (!staffId || !date || !serviceId || !duration) {
      return NextResponse.json(
        { error: "staffId, date, serviceId y duration son requeridos" },
        { status: 400 }
      );
    }

    const parsedDate = parseDateInArgentina(date);
    const settings = business.settings;

    const slots = await getAvailableSlots({
      businessId: business.id,
      staffId,
      date: parsedDate,
      serviceDuration: parseInt(duration, 10),
      slotInterval: settings?.slotInterval ?? 30,
      minHoursAdvance: settings?.minAdvanceHours ?? 2,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    });

    // Real traffic is what drives the background jobs on the free plan: no
    // Vercel cron can run more than once a day there. See `src/lib/jobs/tick.ts`.
    runInBackground("tick", maybeTick);

    return NextResponse.json(
      slots.map((s) => ({
        time: s.time.toISOString(),
        display: s.display,
        available: s.available,
      }))
    );
  } catch (error) {
    return handleApiError(error, "businesses:slug:availability:slots");
  }
}
