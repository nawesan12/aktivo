import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:update");

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
        user: { select: { name: true, phone: true, email: true } },
        guestClient: { select: { name: true, phone: true, email: true } },
        business: { select: { name: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    const updated = await db.appointment.update({
      where: { id },
      data: { status },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: `appointment:${status.toLowerCase()}`,
      entity: "Appointment",
      entityId: id,
      details: { previousStatus: appointment.status, newStatus: status },
    });

    // Send notification on cancellation
    if (status === "CANCELLED") {
      const clientName = appointment.user?.name || appointment.guestClient?.name || "Cliente";
      const clientPhone = appointment.user?.phone || appointment.guestClient?.phone;
      const clientEmail = appointment.user?.email || appointment.guestClient?.email;

      sendNotification({
        businessId: session.businessId,
        businessName: appointment.business.name,
        appointmentId: id,
        clientName,
        clientPhone: clientPhone || undefined,
        clientEmail: clientEmail || undefined,
        serviceName: appointment.service.name,
        staffName: appointment.staff.name,
        dateTime: appointment.dateTime,
        type: "cancellation",
      }).catch(console.error);
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:delete");

    const { id } = await params;

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    await db.appointment.delete({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "appointment:delete",
      entity: "Appointment",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
