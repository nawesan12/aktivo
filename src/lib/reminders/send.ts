import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { createLogger } from "@/lib/logger";

const log = createLogger("reminders");

/**
 * Sends 24h and 1h appointment reminders.
 *
 * The windows are *wider* than the interval this runs at, otherwise a booking
 * can fall between two passes and never be reminded — which is what happened
 * with the previous [+45min, +75min] window on an hourly job.
 *
 * `reminder24hSentAt` / `reminder1hSentAt` make overlapping windows harmless:
 * each reminder is claimed before it is sent, so two passes running at the same
 * time cannot both send it.
 */

const REMINDER_24H = { fromHours: 23, toHours: 25 } as const;
const REMINDER_1H = { fromMinutes: 30, toMinutes: 90 } as const;

/** Per pass. Anything left over is picked up by the next one. */
const BATCH_SIZE = 100;

const APPOINTMENT_INCLUDE = {
  service: { select: { name: true } },
  staff: { select: { name: true } },
  business: { select: { name: true } },
  user: { select: { name: true, email: true } },
  guestClient: { select: { name: true, email: true } },
} as const;

type ReminderKind = "reminder_24h" | "reminder_1h";

export interface ReminderRunResult {
  sent: number;
  failed: number;
  due: { "24h": number; "1h": number };
  saturated: boolean;
}

export async function sendDueReminders(): Promise<ReminderRunResult> {
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

  return {
    sent,
    failed,
    due: { "24h": due24h.length, "1h": due1h.length },
    // A saturated batch used to be harmless because the next run was 15 minutes
    // away. Now a pass may be hours from the next one, so the leftovers matter.
    saturated: due24h.length === BATCH_SIZE || due1h.length === BATCH_SIZE,
  };
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

  const field = type === "reminder_24h" ? "reminder24hSentAt" : "reminder1hSentAt";

  // Claim before sending. Marking afterwards left a window where two passes
  // both read `null` and the customer got the same reminder twice; a duplicate
  // is worse than one that arrives late, and the revert below covers the
  // failure case that marking-after was protecting.
  const claim = await db.appointment.updateMany({
    where: { id: appointment.id, [field]: null },
    data: { [field]: new Date() },
  });

  if (claim.count !== 1) return false;

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

    return true;
  } catch (error) {
    // Hand it back, so the next pass can try again.
    await db.appointment.updateMany({
      where: { id: appointment.id },
      data: { [field]: null },
    });

    log.error("reminder failed", error, { type, appointmentId: appointment.id });
    return false;
  }
}
