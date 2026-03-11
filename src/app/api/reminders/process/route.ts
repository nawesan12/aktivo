import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (!secret || secret !== process.env.REMINDERS_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const now = new Date();

    // 24h reminders: dateTime between now+23h and now+25h
    const from24h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
    const to24h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // 1h reminders: dateTime between now+45min and now+75min
    const from1h = new Date(now.getTime() + 45 * 60 * 1000);
    const to1h = new Date(now.getTime() + 75 * 60 * 1000);

    const [reminders24h, reminders1h] = await Promise.all([
      db.appointment.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: { gte: from24h, lte: to24h },
          reminder24hSentAt: null,
        },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          business: { select: { name: true } },
          user: { select: { name: true, phone: true, email: true } },
          guestClient: { select: { name: true, phone: true, email: true } },
        },
        take: 50,
      }),
      db.appointment.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: { gte: from1h, lte: to1h },
          reminder1hSentAt: null,
        },
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          business: { select: { name: true } },
          user: { select: { name: true, phone: true, email: true } },
          guestClient: { select: { name: true, phone: true, email: true } },
        },
        take: 50,
      }),
    ]);

    // Limit total to 50
    const all24h = reminders24h.slice(0, 50);
    const remaining = 50 - all24h.length;
    const all1h = reminders1h.slice(0, Math.max(0, remaining));

    let processed = 0;

    // Process 24h reminders
    for (const appointment of all24h) {
      const client = appointment.user ?? appointment.guestClient;
      if (!client) continue;

      try {
        await sendNotification({
          businessId: appointment.businessId,
          businessName: appointment.business.name,
          appointmentId: appointment.id,
          clientName: client.name ?? "Cliente",
          clientPhone: client.phone ?? undefined,
          clientEmail: client.email ?? undefined,
          serviceName: appointment.service.name,
          staffName: appointment.staff.name,
          dateTime: appointment.dateTime,
          type: "reminder_24h",
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
        });

        await db.appointment.update({
          where: { id: appointment.id },
          data: { reminder24hSentAt: new Date() },
        });

        processed++;
      } catch (err) {
        console.error(`Reminder 24h error for ${appointment.id}:`, err);
      }
    }

    // Process 1h reminders
    for (const appointment of all1h) {
      const client = appointment.user ?? appointment.guestClient;
      if (!client) continue;

      try {
        await sendNotification({
          businessId: appointment.businessId,
          businessName: appointment.business.name,
          appointmentId: appointment.id,
          clientName: client.name ?? "Cliente",
          clientPhone: client.phone ?? undefined,
          clientEmail: client.email ?? undefined,
          serviceName: appointment.service.name,
          staffName: appointment.staff.name,
          dateTime: appointment.dateTime,
          type: "reminder_1h",
          userId: appointment.userId,
          guestClientId: appointment.guestClientId,
        });

        await db.appointment.update({
          where: { id: appointment.id },
          data: { reminder1hSentAt: new Date() },
        });

        processed++;
      } catch (err) {
        console.error(`Reminder 1h error for ${appointment.id}:`, err);
      }
    }

    return NextResponse.json({ processed });
  } catch (error) {
    console.error("Reminders process error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
