import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { sendTrialEmail, type TrialStage } from "@/lib/notifications/trial-email";

const log = createLogger("trial-reminders");

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Cuándo se avisa, y qué se dice en cada momento.
 *
 * Tres avisos y no más: uno con margen para decidir, otro el día antes, y el de
 * cierre. Un cuarto no convence a nadie y enseña a filtrar los correos.
 */
const AVISOS: { stage: TrialStage; desde: number; hasta: number }[] = [
  // Quedan entre 2 y 3 días.
  { stage: "trial_3d", desde: 2 * DAY_MS, hasta: 3 * DAY_MS },
  // Último día.
  { stage: "trial_1d", desde: 0, hasta: DAY_MS },
  // Ya venció, dentro de las últimas 24 horas.
  { stage: "trial_ended", desde: -DAY_MS, hasta: 0 },
];

/** Por pasada y por aviso. */
const BATCH_SIZE = 50;

export interface TrialReminderResult {
  sent: number;
  failed: number;
}

/**
 * Le avisa al negocio que la prueba se termina, por correo.
 *
 * El banner del panel sólo lo ve quien entra al panel. Quien no abre la
 * aplicación en toda la semana —que es justamente el que está por perderse— se
 * enteraba el día que quiso cargar un turno y no pudo.
 *
 * Se registra cada envío en `Notification`, que es lo que evita repetirlo: la
 * ventana de cada aviso dura un día entero y este trabajo corre muchas veces.
 */
export async function sendTrialReminders(): Promise<TrialReminderResult> {
  const result: TrialReminderResult = { sent: 0, failed: 0 };
  const now = Date.now();

  for (const aviso of AVISOS) {
    const candidatos = await db.business.findMany({
      where: {
        isActive: true,
        trialEndsAt: {
          gte: new Date(now + aviso.desde),
          lt: new Date(now + aviso.hasta),
        },
        // Quien ya está pagando no necesita que le avisen de la prueba.
        subscriptions: { none: { status: "AUTHORIZED" } },
        notifications: { none: { type: aviso.stage } },
      },
      select: {
        id: true,
        name: true,
        email: true,
        members: {
          where: { isActive: true, role: "BUSINESS_OWNER" },
          select: { user: { select: { email: true } } },
          take: 1,
        },
      },
      take: BATCH_SIZE,
    });

    for (const business of candidatos) {
      const to = business.members[0]?.user.email ?? business.email;
      if (!to) continue;

      // Registrado antes de mandar: dos pasadas simultáneas no mandan lo mismo
      // dos veces, y un fallo de Resend no lo deja reintentando todo el día.
      await db.notification.create({
        data: {
          businessId: business.id,
          channel: "EMAIL",
          type: aviso.stage,
          status: "SENT",
          recipient: to,
          sentAt: new Date(),
        },
      });

      try {
        await sendTrialEmail(to, aviso.stage, business.name);
        result.sent += 1;
      } catch (error) {
        log.error("could not send trial email", error, {
          businessId: business.id,
          stage: aviso.stage,
        });
        result.failed += 1;
      }
    }
  }

  if (result.sent > 0 || result.failed > 0) {
    log.info("trial reminders processed", { ...result });
  }

  return result;
}
