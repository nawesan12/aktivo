import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyGuestToken } from "@/lib/guest-auth";
import { getAvailableSlots } from "@/lib/availability";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { parseDateInArgentina } from "@/lib/timezone";
import { sendNotification } from "@/lib/notifications";
import { addMinutes } from "date-fns";
import { handleApiError } from "@/lib/api-errors";
import { runInBackground } from "@/lib/background";

export async function POST(
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
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verify business slug matches
    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, settings: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { appointmentId, newDate, newTime } = await request.json();

    if (!appointmentId || !newDate || !newTime) {
      return NextResponse.json(
        { error: "Datos incompletos. Se requiere appointmentId, newDate y newTime" },
        { status: 400 }
      );
    }

    // Find the existing appointment
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        guestClientId: guest.guestClientId,
        businessId: guest.businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gt: new Date() },
      },
      include: {
        service: { select: { id: true, name: true, duration: true, businessId: true } },
        staff: { select: { id: true, name: true } },
        guestClient: { select: { name: true, phone: true, email: true } },
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
    const settings = business.settings;

    // Expired unpaid holds still occupy the slot for the database constraint,
    // so they have to go before we read availability or write into it.
    await releaseExpiredHolds({ businessId: business.id });

    const slots = await getAvailableSlots({
      businessId: business.id,
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
        where: { id: appointmentId },
        data: {
          status: "CANCELLED",
          notes: `Reprogramado → ${newDate} ${newTime}`,
        },
      });

      const newAppointment = await tx.appointment.create({
        data: {
          businessId: business.id,
          serviceId: appointment.serviceId,
          staffId: appointment.staffId,
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
          dateTime: slot.time,
          endTime: addMinutes(slot.time, appointment.service.duration),
          status: "CONFIRMED",
          rescheduledFromId: appointmentId,
        },
      });

      return newAppointment;
    });

    // Send reschedule notification
    runInBackground("reschedule-notice", () =>
      sendNotification({
        businessId: business.id,
        businessName: business.name,
        businessSlug: business.slug,
        appointmentId: result.id,
        clientName: appointment.guestClient?.name ?? "Cliente",
        clientEmail: appointment.guestClient?.email ?? undefined,
        serviceName: appointment.service.name,
        staffName: appointment.staff.name,
        dateTime: slot.time,
        type: "reschedule",
        guestClientId: guest.guestClientId,
      }));

    return NextResponse.json({
      id: result.id,
      dateTime: result.dateTime,
    });
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-appointments:reschedule");
  }
}
