import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { sendReviewRequestEmail } from "@/lib/notifications/review-request-email";
import { handleApiError } from "@/lib/api-errors";
import { addDays } from "date-fns";
import { appUrl } from "@/lib/env";
import { runInBackground } from "@/lib/background";

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
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const appointment = await db.appointment.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true, userId: true, googleCalendarEnabled: true } },
        user: { select: { name: true, phone: true, email: true } },
        guestClient: { select: { name: true, phone: true, email: true } },
        business: { select: { name: true, slug: true } },
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
      const clientEmail = appointment.user?.email || appointment.guestClient?.email;

      runInBackground("cancellation-notice", () =>
        sendNotification({
          businessId: session.businessId,
          businessName: appointment.business.name,
          appointmentId: id,
          clientName,
          clientEmail: clientEmail || undefined,
          serviceName: appointment.service.name,
          staffName: appointment.staff.name,
          dateTime: appointment.dateTime,
          type: "cancellation",
        }), { appointmentId: id });

      // The freed slot is the whole point of the waitlist: offer it right away.
      runInBackground("waitlist-notice", async () => {
        const { notifyWaitlistOnCancellation } = await import("@/lib/waitlist");
        await notifyWaitlistOnCancellation({
          businessId: session.businessId,
          serviceId: appointment.serviceId,
          dateTime: appointment.dateTime,
          businessName: appointment.business.name,
          businessSlug: appointment.business.slug,
          serviceName: appointment.service.name,
          staffName: appointment.staff.name,
        });
      }, { appointmentId: id });

      // Google Calendar: delete event if synced
      if (appointment.googleCalendarEventId && appointment.staff.userId) {
        runInBackground("calendar-delete", async () => {
          const { deleteCalendarEvent } = await import("@/lib/google-calendar");
          await deleteCalendarEvent(
            appointment.staff.userId!,
            appointment.googleCalendarEventId!
          );
        }, { appointmentId: id });
      }
    }

    // Trigger review request on COMPLETED (Feature 1)
    if (status === "COMPLETED") {
      const clientName = appointment.user?.name || appointment.guestClient?.name || "Cliente";
      const clientEmail = appointment.user?.email || appointment.guestClient?.email;

      // Create review token
      db.reviewToken.create({
        data: {
          businessId: session.businessId,
          appointmentId: id,
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
          expiresAt: addDays(new Date(), 7),
        },
      }).then((token) => {
        const reviewUrl = appUrl(`/review/${token.token}`);

        if (clientEmail) {
          runInBackground("review-request-email", () =>
            sendReviewRequestEmail({
              to: clientEmail,
              clientName,
              businessName: appointment.business.name,
              serviceName: appointment.service.name,
              reviewUrl,
            }), { appointmentId: id });
        }
      });
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
      include: { staff: { select: { userId: true } } },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // Google Calendar cleanup
    if (appointment.googleCalendarEventId && appointment.staff?.userId) {
      runInBackground("calendar-delete", async () => {
        const { deleteCalendarEvent } = await import("@/lib/google-calendar");
        await deleteCalendarEvent(
          appointment.staff!.userId!,
          appointment.googleCalendarEventId!
        );
      }, { appointmentId: id });
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
