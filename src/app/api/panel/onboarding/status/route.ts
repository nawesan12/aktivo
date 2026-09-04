import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const { businessId } = await getSessionBusiness();

    const business = await db.business.findUnique({
      where: { id: businessId },
      select: {
        description: true,
        _count: {
          select: {
            services: true,
            staff: true,
          },
        },
        staff: { select: { _count: { select: { workingHours: true } } } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    /*
      Hours are a step. Without them a shop can tick every other box and still
      offer no slots at all, because availability is computed from a
      professional's working hours and there are none.
    */
    const steps = {
      profile: !!business.description,
      services: business._count.services > 0,
      staff: business._count.staff > 0,
      hours: business.staff.some((member) => member._count.workingHours > 0),
    };

    const isComplete = steps.profile && steps.services && steps.staff && steps.hours;

    return NextResponse.json({ isComplete, steps });
  } catch (error) {
    return handleApiError(error);
  }
}
