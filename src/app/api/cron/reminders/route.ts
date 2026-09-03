import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { assertCronRequest } from "@/lib/cron-auth";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:reminders");

/**
 * Sends 24h and 1h appointment reminders.
 *
 * Scheduled every 15 minutes (see vercel.json). The windows below must stay
 * *wider* than the schedule interval, otherwise a booking can fall between two
 * runs and never be reminded — which is what happened with the previous
 * [+45min, +75min] window on an hourly job.
 *
 * `reminder24hSentAt` / `reminder1hSentAt` make overlapping windows harmless:
 * each reminder is sent at most once.
 */

const REMINDER_24H = { fromHours: 23, toHours: 25, field: "reminder24hSentAt" } as const;
const REMINDER_1H = { fromMinutes: 30, toMinutes: 90, field: "reminder1hSentAt" } as const;

/** Per run. Anything not processed is picked up by the next run 15 minutes later. */
const BATCH_SIZE = 100;

const APPOINTMENT_INCLUDE = {
  service: { select: { name: true } },
  staff: { select: { name: true } },
  business: { select: { name: true } },
  user: { select: { name: true, phone: true, email: true } },
  guestClient: { select: { name: true, phone: true, email: true } },
} as const;

type ReminderKind = "reminder_24h" | "reminder_1h";

export async function GET(request: NextRequest) {
  try {
    assertCronRequest(request);

    const now = Date.now();

    const [due24h, due1h] = await Promise.all([
      db.appointment.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: {
            gte: new Date(now + REMINDER_24H.fromHours * 60 * 60 * 1000),
            lte: new Date(now + REMINDER_24H.toHours * 60 * 60 * 1000),
          },
          reminder24hSentAt: null,
        },
        include: APPOINTMENT_INCLUDE,
        orderBy: { dateTime: "asc" },
        take: BATCH_SIZE,
      }),
      db.appointment.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          dateTime: {
            gte: new Date(now + REMINDER_1H.fromMinutes * 60 * 1000),
            lte: new Date(now + REMINDER_1H.toMinutes * 60 * 1000),
          },
          reminder1hSentAt: null,
        },
        include: APPOINTMENT_INCLUDE,
        orderBy: { dateTime: "asc" },
        take: BATCH_SIZE,
      }),
    ]);

    const results = await Promise.allSettled([
      ...due24h.map((a) => sendReminder(a, "reminder_24h")),
      ...due1h.map((a) => sendReminder(a, "reminder_1h")),
    ]);

    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    const failed = results.filter(
      (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value)
    ).length;

    // Reported so a run that silently stops delivering is visible.
    return NextResponse.json({
      sent,
      failed,
      due: { "24h": due24h.length, "1h": due1h.length },
      saturated: due24h.length === BATCH_SIZE || due1h.length === BATCH_SIZE,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

type AppointmentWithRelations = Awaited<
  ReturnType<typeof db.appointment.findMany<{ include: typeof APPOINTMENT_INCLUDE }>>
>[number];

async function sendReminder(
  appointment: AppointmentWithRelations,
  type: ReminderKind
): Promise<boolean> {
  const client = appointment.user ?? appointment.guestClient;
  if (!client) return false;

  try {
    await sendNotification({
      businessId: appointment.businessId,
      businessName: appointment.business.name,
      appointmentId: appointment.id,
      clientName: client.name ?? "Cliente",
      clientEmail: client.email ?? undefined,
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
      dateTime: appointment.dateTime,
      type,
      userId: appointment.userId,
      guestClientId: appointment.guestClientId,
    });

    // Marked only after a successful send, so a failure is retried next run.
    await db.appointment.update({
      where: { id: appointment.id },
      data:
        type === "reminder_24h"
          ? { reminder24hSentAt: new Date() }
          : { reminder1hSentAt: new Date() },
    });

    return true;
  } catch (error) {
    log.error("reminder failed", error, { type, appointmentId: appointment.id });
    return false;
  }
}
