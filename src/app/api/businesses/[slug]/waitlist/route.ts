import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { addDays } from "date-fns";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIP(request);
    const { success } = rateLimit({ key: `waitlist:${ip}`, limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
    }

    const { slug } = await params;
    const { name, phone, serviceId, staffId, preferredDate } = await request.json();

    if (!name || !phone || !serviceId || !preferredDate) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    if (typeof phone !== "string" || phone.length < 10) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Check if service exists
    const service = await db.service.findFirst({
      where: { id: serviceId, businessId: business.id, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const entry = await db.waitlistEntry.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId: staffId || null,
        name,
        phone,
        preferredDate: new Date(preferredDate),
        expiresAt: addDays(new Date(), 30),
      },
    });

    return NextResponse.json({ id: entry.id, success: true }, { status: 201 });
  } catch (error) {
    console.error("Waitlist error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
