import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toArgentinaDate } from "@/lib/timezone";
import { format } from "date-fns";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");
    const staffId = searchParams.get("staffId");

    // Find business
    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Build filter
    const where: Record<string, unknown> = {
      userId: session.user.id,
      businessId: business.id,
      status: "COMPLETED",
    };

    if (serviceId) where.serviceId = serviceId;
    if (staffId) where.staffId = staffId;

    // Find last 10 completed appointments
    const appointments = await db.appointment.findMany({
      where,
      orderBy: { dateTime: "desc" },
      take: 10,
      select: { dateTime: true },
    });

    if (appointments.length === 0) {
      return NextResponse.json(null);
    }

    // Extract day of week and hour from each appointment
    const dayCounts = new Map<number, number>();
    const timeCounts = new Map<string, number>();

    for (const appt of appointments) {
      const tzDate = toArgentinaDate(appt.dateTime);
      const day = tzDate.getDay();
      const time = format(tzDate, "HH:mm");

      dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);
      timeCounts.set(time, (timeCounts.get(time) ?? 0) + 1);
    }

    // Find most common day and time
    let suggestedDay = 0;
    let maxDayCount = 0;
    for (const [day, count] of dayCounts) {
      if (count > maxDayCount) {
        maxDayCount = count;
        suggestedDay = day;
      }
    }

    let suggestedTime = "09:00";
    let maxTimeCount = 0;
    for (const [time, count] of timeCounts) {
      if (count > maxTimeCount) {
        maxTimeCount = count;
        suggestedTime = time;
      }
    }

    // Determine confidence based on the higher of the two counts
    const maxCount = Math.max(maxDayCount, maxTimeCount);
    const confidence: "high" | "medium" | "low" =
      maxCount >= 6 ? "high" : maxCount >= 3 ? "medium" : "low";

    return NextResponse.json({
      suggestedDay,
      suggestedTime,
      confidence,
    });
  } catch (error) {
    return handleApiError(error, "businesses:slug:suggestions");
  }
}
