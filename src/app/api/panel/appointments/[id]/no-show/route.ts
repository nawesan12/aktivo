import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import { recordNoShow } from "@/lib/no-show";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:update");

    const { id } = await params;

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: session.businessId },
      select: { id: true, status: true, userId: true, guestClientId: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    if (appointment.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Solo se puede marcar como ausencia un turno confirmado" },
        { status: 400 }
      );
    }

    const result = await recordNoShow({
      businessId: session.businessId,
      appointmentId: id,
      userId: appointment.userId,
      guestClientId: appointment.guestClientId,
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "appointment:no_show",
      entity: "Appointment",
      entityId: id,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
