import { db } from "@/lib/db";
import { sendNotification } from "@/lib/notifications";
import { createLogger } from "@/lib/logger";

const log = createLogger("reminders");

/**
 * El recordatorio del día anterior.
 *
 * La ventana es *más ancha* que el intervalo al que corre esto; si no, una
 * reserva puede caer entre dos pasadas y no recordarse nunca — que es lo que
 * pasaba con la ventana de [+45min, +75min] en un trabajo cada hora.
 *
 * Había también un recordatorio una hora antes. Se sacó: su ventana era de
 * sesenta minutos y el trabajo lo dispara el tráfico real, con un piso de
 * GitHub Actions que en la práctica corre cada dos horas — así que la mayoría
 * de las veces no salía. Prometer un aviso que no llega es peor que no
 * prometerlo. La columna `reminder1hSentAt` queda en la base sin uso; sacarla
 * es una migración destructiva que no vale la pena.
 *
 * `reminder24hSentAt` hace inofensivas las ventanas superpuestas: el
 * recordatorio se reserva antes de mandarse, así que dos pasadas simultáneas no
 * pueden mandar el mismo.
 */

const REMINDER_24H = { fromHours: 23, toHours: 25 } as const;

/** Per pass. Anything left over is picked up by the next one. */
const BATCH_SIZE = 100;

const APPOINTMENT_INCLUDE = {
  service: { select: { name: true } },
  staff: { select: { name: true } },
  business: { select: { name: true, slug: true } },
  user: { select: { name: true, email: true } },
  guestClient: { select: { name: true, email: true } },
} as const;

export interface ReminderRunResult {
  sent: number;
  failed: number;
  due: number;
  saturated: boolean;
}

export async function sendDueReminders(): Promise<ReminderRunResult> {
  const now = Date.now();

  const due24h = await db.appointment.findMany({
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
  });

  const results = await Promise.allSettled(due24h.map((a) => sendReminder(a)));

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.filter(
    (r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value)
  ).length;

  return {
    sent,
    failed,
    due: due24h.length,
    // A saturated batch used to be harmless because the next run was 15 minutes
    // away. Now a pass may be hours from the next one, so the leftovers matter.
    saturated: due24h.length === BATCH_SIZE,
  };
}

type AppointmentWithRelations = Awaited<
  ReturnType<typeof db.appointment.findMany<{ include: typeof APPOINTMENT_INCLUDE }>>
>[number];

async function sendReminder(appointment: AppointmentWithRelations): Promise<boolean> {
  const client = appointment.user ?? appointment.guestClient;
  if (!client) return false;

  // Claim before sending. Marking afterwards left a window where two passes
  // both read `null` and the customer got the same reminder twice; a duplicate
  // is worse than one that arrives late, and the revert below covers the
  // failure case that marking-after was protecting.
  const claim = await db.appointment.updateMany({
    where: { id: appointment.id, reminder24hSentAt: null },
    data: { reminder24hSentAt: new Date() },
  });

  if (claim.count !== 1) return false;

  try {
    await sendNotification({
      businessId: appointment.businessId,
      businessName: appointment.business.name,
      businessSlug: appointment.business.slug,
      appointmentId: appointment.id,
      clientName: client.name ?? "Cliente",
      clientEmail: client.email ?? undefined,
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
      dateTime: appointment.dateTime,
      type: "reminder_24h",
      userId: appointment.userId,
      guestClientId: appointment.guestClientId,
    });

    return true;
  } catch (error) {
    // Hand it back, so the next pass can try again.
    await db.appointment.updateMany({
      where: { id: appointment.id },
      data: { reminder24hSentAt: null },
    });

    log.error("reminder failed", error, { appointmentId: appointment.id });
    return false;
  }
}
