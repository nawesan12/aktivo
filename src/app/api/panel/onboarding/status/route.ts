import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { db } from "@/lib/db";

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
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const steps = {
      profile: !!business.description,
      services: business._count.services > 0,
      staff: business._count.staff > 0,
    };

    const isComplete = steps.profile && steps.services && steps.staff;

    return NextResponse.json({ isComplete, steps });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Sin negocio") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
