import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyGuestToken } from "@/lib/guest-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get("guest-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const guest = await verifyGuestToken(token);
    if (!guest) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    // Verify business matches
    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();

    const [upcoming, past] = await Promise.all([
      db.appointment.findMany({
        where: {
          guestClientId: guest.guestClientId,
          businessId: guest.businessId,
          dateTime: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        include: {
          service: { select: { name: true, duration: true } },
          staff: { select: { name: true } },
        },
        orderBy: { dateTime: "asc" },
        take: 20,
      }),
      db.appointment.findMany({
        where: {
          guestClientId: guest.guestClientId,
          businessId: guest.businessId,
          OR: [
            { dateTime: { lt: now } },
            { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
          ],
        },
        include: {
          service: { select: { name: true, duration: true } },
          staff: { select: { name: true } },
        },
        orderBy: { dateTime: "desc" },
        take: 20,
      }),
    ]);

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error("Guest appointments error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get("guest-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const guest = await verifyGuestToken(token);
    if (!guest) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { appointmentId } = await request.json();

    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        guestClientId: guest.guestClientId,
        businessId: guest.businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gt: new Date() },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado o no cancelable" }, { status: 404 });
    }

    const updated = await db.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Guest cancel error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
