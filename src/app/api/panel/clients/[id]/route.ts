import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:read");

    const { id } = await params;

    // Try registered user first
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        appointments: {
          where: { businessId: session.businessId },
          orderBy: { dateTime: "desc" },
          include: {
            service: { select: { name: true, price: true } },
            staff: { select: { name: true } },
            payment: { select: { amount: true, status: true } },
          },
        },
      },
    });

    if (user) {
      const totalSpent = user.appointments
        .filter((a) => a.payment?.status === "APPROVED")
        .reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

      return NextResponse.json({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        type: "registered",
        createdAt: user.createdAt,
        totalSpent,
        appointments: user.appointments.map((a) => ({
          id: a.id,
          serviceName: a.service.name,
          staffName: a.staff.name,
          dateTime: a.dateTime,
          status: a.status,
          price: a.service.price,
          paymentStatus: a.payment?.status || null,
          paymentAmount: a.payment?.amount || null,
        })),
      });
    }

    // Try guest client
    const guest = await db.guestClient.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        appointments: {
          orderBy: { dateTime: "desc" },
          include: {
            service: { select: { name: true, price: true } },
            staff: { select: { name: true } },
            payment: { select: { amount: true, status: true } },
          },
        },
      },
    });

    if (!guest) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const totalSpent = guest.appointments
      .filter((a) => a.payment?.status === "APPROVED")
      .reduce((sum, a) => sum + (a.payment?.amount || 0), 0);

    return NextResponse.json({
      id: guest.id,
      name: guest.name,
      email: guest.email,
      phone: guest.phone,
      type: "guest",
      createdAt: guest.createdAt,
      totalSpent,
      appointments: guest.appointments.map((a) => ({
        id: a.id,
        serviceName: a.service.name,
        staffName: a.staff.name,
        dateTime: a.dateTime,
        status: a.status,
        price: a.service.price,
        paymentStatus: a.payment?.status || null,
        paymentAmount: a.payment?.amount || null,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
