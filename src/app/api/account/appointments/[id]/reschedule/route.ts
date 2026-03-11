import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAvailableSlots } from "@/lib/availability";
import { parseDateInArgentina } from "@/lib/timezone";
import { sendNotification } from "@/lib/notifications";
import { addMinutes } from "date-fns";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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
        userId: session.user.id,
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
          userId: session.user.id,
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
    sendNotification({
      businessId: appointment.businessId,
      businessName: appointment.business.name,
      appointmentId: result.id,
      clientName: session.user.name ?? "Cliente",
      clientEmail: session.user.email ?? undefined,
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
      dateTime: slot.time,
      type: "reschedule",
      userId: session.user.id,
    }).catch((err) => console.error("Reschedule notification error:", err));

    return NextResponse.json({
      id: result.id,
      dateTime: result.dateTime,
    });
  } catch (error) {
    console.error("Account reschedule error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
