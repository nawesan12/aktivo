import { addDays, startOfDay } from "date-fns";

import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { nowInArgentina } from "@/lib/timezone";
import { sendDailyDigestEmail, type DigestAppointment } from "@/lib/notifications/daily-digest-email";

const log = createLogger("daily-digest");

/**
 * A partir de qué hora, en la del negocio, se manda el resumen del día
 * siguiente. A las siete de la tarde la agenda de mañana ya está armada y
 * todavía se está a tiempo de mover algo.
 */
const SEND_FROM_HOUR = 19;

/** Por pasada. Lo que sobre sale en la siguiente. */
const BATCH_SIZE = 50;

export interface DailyDigestResult {
  sent: number;
  skipped: number;
  failed: number;
}

/**
 * "Tus turnos de mañana", una vez por día y por negocio.
 *
 * Es lo que faltaba del lado del dueño: la única notificación que salía por una
 * reserva era la del cliente, así que un turno tomado a las once de la noche
 * esperaba a que alguien abriera el panel.
 *
 * Oportunista como todo lo demás —lo dispara el tráfico real, ver `tick.ts`—,
 * de modo que corre muchas veces por tarde. `dailyDigestSentFor` guarda el día
 * ya resumido y se reserva *antes* de mandar, así dos pasadas simultáneas no
 * mandan el mismo correo dos veces.
 */
export async function sendDailyDigests(): Promise<DailyDigestResult> {
  const result: DailyDigestResult = { sent: 0, skipped: 0, failed: 0 };

  const now = nowInArgentina();
  if (now.getHours() < SEND_FROM_HOUR) {
    return result;
  }

  // El día de mañana, a medianoche en la zona del negocio. `new Date("...")`
  // sería medianoche UTC, que en Argentina cae el día anterior.
  const tomorrow = startOfDay(addDays(now, 1)) as unknown as Date;
  const dayAfter = addDays(tomorrow, 1);

  const candidates = await db.businessSettings.findMany({
    where: {
      dailyDigestEnabled: true,
      // Lo de hoy ya salió: `sentFor` guarda el día resumido.
      OR: [{ dailyDigestSentFor: null }, { dailyDigestSentFor: { lt: tomorrow } }],
    },
    select: {
      businessId: true,
      business: {
        select: {
          name: true,
          email: true,
          isActive: true,
          members: {
            where: { isActive: true, role: "BUSINESS_OWNER" },
            select: { user: { select: { email: true } } },
            take: 1,
          },
        },
      },
    },
    take: BATCH_SIZE,
  });

  for (const settings of candidates) {
    const business = settings.business;
    if (!business?.isActive) {
      result.skipped += 1;
      continue;
    }

    // La cuenta que dio de alta el negocio primero: es la que lo mira. El email
    // del local es el de cara al público y puede ser un buzón que nadie abre.
    const to = business.members[0]?.user.email ?? business.email;
    if (!to) {
      result.skipped += 1;
      continue;
    }

    const appointments = await db.appointment.findMany({
      where: {
        businessId: settings.businessId,
        status: { in: ["PENDING", "CONFIRMED"] },
        dateTime: { gte: tomorrow, lt: dayAfter },
      },
      orderBy: { dateTime: "asc" },
      select: {
        dateTime: true,
        service: { select: { name: true } },
        staff: { select: { name: true } },
        user: { select: { name: true } },
        guestClient: { select: { name: true } },
      },
    });

    /*
      Un día sin turnos no manda nada.

      "Mañana no tenés turnos" todas las tardes es el correo que enseña a
      ignorar los correos, y el dato ya está en el panel para quien lo quiera.
    */
    if (appointments.length === 0) {
      await marcarEnviado(settings.businessId, tomorrow);
      result.skipped += 1;
      continue;
    }

    // Reservado antes de mandar: dos pasadas a la vez no mandan lo mismo dos
    // veces, y un fallo de Resend no deja el correo repitiéndose toda la tarde.
    await marcarEnviado(settings.businessId, tomorrow);

    const lista: DigestAppointment[] = appointments.map((appointment) => ({
      dateTime: appointment.dateTime,
      clientName: appointment.user?.name ?? appointment.guestClient?.name ?? "Cliente",
      serviceName: appointment.service.name,
      staffName: appointment.staff.name,
    }));

    try {
      await sendDailyDigestEmail(to, business.name, tomorrow, lista);
      result.sent += 1;
    } catch (error) {
      log.error("could not send daily digest", error, { businessId: settings.businessId });
      result.failed += 1;
    }
  }

  if (result.sent > 0 || result.failed > 0) {
    log.info("daily digests processed", { ...result });
  }

  return result;
}

function marcarEnviado(businessId: string, day: Date) {
  return db.businessSettings.update({
    where: { businessId },
    data: { dailyDigestSentFor: day },
  });
}

/** Exportado para los tests. */
export const DAILY_DIGEST_SEND_FROM_HOUR = SEND_FROM_HOUR;
