import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { sendReviewRequestEmail } from "@/lib/notifications/review-request-email";
import { sendWhatsApp } from "@/lib/notifications/whatsapp";
import { handleApiError } from "@/lib/api-errors";
import { addDays } from "date-fns";

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

      // Notify matching waitlist entries (event-driven)
      import("@/lib/waitlist").then(({ notifyWaitlistOnCancellation }) => {
        notifyWaitlistOnCancellation({
          businessId: session.businessId,
          serviceId: appointment.serviceId,
          dateTime: appointment.dateTime,
          businessName: appointment.business.name,
          businessSlug: appointment.business.slug,
          serviceName: appointment.service.name,
          staffName: appointment.staff.name,
        }).catch(console.error);
      }).catch(console.error);

      // Google Calendar: delete event if synced
      if (appointment.googleCalendarEventId && appointment.staff.userId) {
        import("@/lib/google-calendar").then(({ deleteCalendarEvent }) => {
          deleteCalendarEvent(appointment.staff.userId!, appointment.googleCalendarEventId!).catch(console.error);
        }).catch(console.error);
      }
    }

    // Trigger review request on COMPLETED (Feature 1)
    if (status === "COMPLETED") {
      const clientName = appointment.user?.name || appointment.guestClient?.name || "Cliente";
      const clientPhone = appointment.user?.phone || appointment.guestClient?.phone;
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
        const reviewUrl = `${process.env.NEXTAUTH_URL}/review/${token.token}`;

        // Send email if client has email
        if (clientEmail) {
          sendReviewRequestEmail({
            to: clientEmail,
            clientName,
            businessName: appointment.business.name,
            serviceName: appointment.service.name,
            reviewUrl,
          }).catch(console.error);
        }

        // Send WhatsApp if client has phone
        if (clientPhone) {
          sendWhatsApp({
            to: clientPhone,
            type: "review_request",
            businessName: appointment.business.name,
            clientName,
            serviceName: appointment.service.name,
            staffName: appointment.staff.name,
            dateTime: appointment.dateTime,
            bookingUrl: reviewUrl,
          }).catch(console.error);
        }
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
      include: { staff: { select: { userId: true } } },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }

    // Google Calendar cleanup
    if (appointment.googleCalendarEventId && appointment.staff?.userId) {
      import("@/lib/google-calendar").then(({ deleteCalendarEvent }) => {
        deleteCalendarEvent(appointment.staff!.userId!, appointment.googleCalendarEventId!).catch(console.error);
      }).catch(console.error);
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
