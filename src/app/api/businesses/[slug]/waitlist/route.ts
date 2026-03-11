import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { verifyGuestToken } from "@/lib/guest-auth";
import { addDays } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get("guest-token")?.value;

    if (!token) {
      return NextResponse.json({ entries: [] });
    }

    const guest = await verifyGuestToken(token);
    if (!guest) {
      return NextResponse.json({ entries: [] });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ entries: [] });
    }

    // Find waitlist entries by phone
    const guestClient = await db.guestClient.findUnique({
      where: { id: guest.guestClientId },
      select: { phone: true },
    });

    if (!guestClient) {
      return NextResponse.json({ entries: [] });
    }

    const entries = await db.waitlistEntry.findMany({
      where: {
        businessId: business.id,
        phone: guestClient.phone,
        expiresAt: { gt: new Date() },
      },
      include: {
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Waitlist GET error:", error);
    return NextResponse.json({ entries: [] });
  }
}

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
    const { name, phone, email, serviceId, staffId, preferredDate } = await request.json();

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
        email: email || null,
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
