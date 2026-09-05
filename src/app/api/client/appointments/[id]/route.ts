import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { runInBackground } from "@/lib/background";
import { sendNotification } from "@/lib/notifications";
import { refundVisit } from "@/lib/memberships";
import { clientAppointmentWhere, resolveClientIdentity } from "@/lib/client-identity";

/**
 * The customer cancels their own appointment.
 *
 * Replaces the PATCH that hung off the per-business guest portal, which knew
 * nothing about anybody holding an account and — unlike the panel's own cancel
 * — neither gave a membership visit back nor told the shop.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await resolveClientIdentity();
    if (!identity) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;

    const appointment = await db.appointment.findFirst({
      where: {
        id,
        AND: [clientAppointmentWhere(identity)],
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gt: new Date() },
      },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
        business: { select: { id: true, name: true, slug: true } },
        user: { select: { name: true, email: true } },
        guestClient: { select: { name: true, email: true } },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado o no cancelable" },
        { status: 404 }
      );
    }

    // A visit paid with an abono goes back to the member: otherwise cancelling
    // costs them twice, the slot and the visit.
    await refundVisit(id);

    const updated = await db.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
      select: { id: true, status: true, dateTime: true },
    });

    runInBackground("client-cancellation-notice", () =>
      sendNotification({
        businessId: appointment.businessId,
        businessName: appointment.business.name,
        businessSlug: appointment.business.slug,
        appointmentId: id,
        clientName:
          appointment.user?.name || appointment.guestClient?.name || identity.name || "Cliente",
        clientEmail:
          appointment.user?.email || appointment.guestClient?.email || identity.email || undefined,
        serviceName: appointment.service.name,
        staffName: appointment.staff.name,
        dateTime: appointment.dateTime,
        type: "cancellation",
        userId: appointment.userId,
        guestClientId: appointment.guestClientId,
      })
    );

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error, "client:appointments:id");
  }
}
