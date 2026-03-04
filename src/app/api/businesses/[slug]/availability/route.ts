import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { getAvailableDates } from "@/lib/availability";

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

    if (!staffId) {
      return NextResponse.json({ error: "staffId es requerido" }, { status: 400 });
    }

    const maxDays = business.settings?.maxAdvanceDays ?? 30;
    const dates = await getAvailableDates(staffId, maxDays);

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
