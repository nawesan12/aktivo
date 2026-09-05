import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clientAppointmentWhere, resolveClientIdentity } from "@/lib/client-identity";
import { getAvailableSlots } from "@/lib/availability";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { parseDateInArgentina } from "@/lib/timezone";
import { sendNotification } from "@/lib/notifications";
import { addMinutes } from "date-fns";
import { handleApiError } from "@/lib/api-errors";
import { runInBackground } from "@/lib/background";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const identity = await resolveClientIdentity();
    if (!identity) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { id } = await params;
    const { newDate, newTime } = await request.json();

    if (!newDate || !newTime) {
      return NextResponse.json(
        { error: "Datos incompletos. Se requiere newDate y newTime" },
        { status: 400 }
      );
    }

    // Find the existing appointment
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        // Ownership is the identity's, not the session's: a guest who verified
        // their inbox reschedules the same way somebody with an account does.
        AND: [clientAppointmentWhere(identity)],
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gt: new Date() },
      },
      include: {
        service: {
          select: { id: true, name: true, duration: true, businessId: true },
        },
        staff: { select: { id: true, name: true } },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            settings: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Turno no encontrado o no reprogramable" },
        { status: 404 }
      );
    }

    // Parse new date and check slot availability
    const date = parseDateInArgentina(newDate);
    const settings = appointment.business.settings;

    // Expired unpaid holds still occupy the slot for the database constraint,
    // so they have to go before we read availability or write into it.
    await releaseExpiredHolds({ businessId: appointment.businessId });

    const slots = await getAvailableSlots({
      businessId: appointment.businessId,
      staffId: appointment.staffId,
      date,
      serviceDuration: appointment.service.duration,
      slotInterval: settings?.slotInterval ?? 30,
      minHoursAdvance: settings?.minAdvanceHours ?? 2,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    });

    const slot = slots.find((s) => s.display === newTime);

    if (!slot || !slot.available) {
      return NextResponse.json(
        { error: "El horario seleccionado no esta disponible" },
        { status: 409 }
      );
    }

    // Transaction: cancel old + create new
    const result = await db.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          notes: `Reprogramado → ${newDate} ${newTime}`,
        },
      });

      const newAppointment = await tx.appointment.create({
        data: {
          businessId: appointment.businessId,
          serviceId: appointment.serviceId,
          staffId: appointment.staffId,
          // Carried over from the appointment being replaced rather than from
          // the identity: whichever half it was booked into, it stays there.
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
          dateTime: slot.time,
          endTime: addMinutes(slot.time, appointment.service.duration),
          status: "CONFIRMED",
          rescheduledFromId: id,
        },
      });

      return newAppointment;
    });

    // Send reschedule notification
    runInBackground("reschedule-notice", () =>
      sendNotification({
        businessId: appointment.businessId,
        businessName: appointment.business.name,
        businessSlug: appointment.business.slug,
        appointmentId: result.id,
        clientName: identity.name ?? "Cliente",
        clientEmail: identity.email ?? undefined,
        serviceName: appointment.service.name,
        staffName: appointment.staff.name,
        dateTime: slot.time,
        type: "reschedule",
        userId: appointment.userId ?? undefined,
      }));

    return NextResponse.json({
      id: result.id,
      dateTime: result.dateTime,
    });
  } catch (error) {
    return handleApiError(error, "client:appointments:id:reschedule");
  }
}
