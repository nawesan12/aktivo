import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { sendDueReminders } from "@/lib/reminders/send";
import { autoMarkNoShows } from "@/lib/no-show";
import { redeliverFailedNotifications } from "@/lib/notifications/redelivery";
import { sendPendingReviewRequests } from "@/lib/reviews/requests";
import { renewMercadoPagoLinks } from "@/lib/mercadopago-renewal";
import { sendDailyDigests } from "@/lib/jobs/daily-digest";
import { purgeOldRows } from "@/lib/jobs/purge";

export interface Job {
  /** Matches the primary key of the `JobRun` row. */
  name: string;
  /** Shortest gap between two passes. */
  intervalSeconds: number;
  /**
   * Whether real traffic can trigger it. Jobs that must happen on a given day
   * regardless of whether anyone visited the site are left to the daily cron.
   */
  opportunistic: boolean;
  run: () => Promise<unknown>;
}

/**
 * Everything that used to be a cron entry, and how often it may run.
 *
 * Vercel's Hobby plan only allows one cron per day, so the schedule moved into
 * the app: real requests trigger the work through `after()`, and a single daily
 * cron is the floor underneath. See `tick.ts`.
 */
/*
  Every job here is opportunistic on purpose: there is no Vercel cron declared
  in vercel.json, so real traffic through `maybeTick()` is what runs them. A job
  added with `opportunistic: false` would never run at all until a cron is
  scheduled again — see src/app/api/cron/daily/route.ts.
*/
export const JOBS: Job[] = [
  {
    // Second line of defence. The booking paths already release holds inline,
    // which is what guarantees no slot is permanently dead; this catches the
    // ones nobody tried to rebook, so the owner's agenda stays honest.
    name: "expire-holds",
    intervalSeconds: 300,
    opportunistic: true,
    run: () => releaseExpiredHolds({}, 500),
  },
  {
    name: "reminders",
    intervalSeconds: 300,
    opportunistic: true,
    run: sendDueReminders,
  },
  {
    name: "retry-notifications",
    intervalSeconds: 900,
    opportunistic: true,
    run: redeliverFailedNotifications,
  },
  {
    name: "no-shows",
    intervalSeconds: 900,
    opportunistic: true,
    run: autoMarkNoShows,
  },
  {
    name: "review-requests",
    intervalSeconds: 1800,
    opportunistic: true,
    run: sendPendingReviewRequests,
  },
  {
    /*
      "Tus turnos de mañana", a partir de las 19 en la hora del negocio.

      Cada media hora porque la ventana es toda la tarde y `dailyDigestSentFor`
      hace que las pasadas de más no cuesten nada: la primera que encuentre el
      día sin resumir lo manda, y las siguientes no ven ningún negocio pendiente.
    */
    name: "daily-digest",
    intervalSeconds: 1800,
    opportunistic: true,
    run: sendDailyDigests,
  },
  {
    /*
      Podar lo que ya nadie lee.

      Ninguna de esas tablas se limpiaba y las tres crecen con el uso: mil
      notificaciones por mes por negocio, y una fila de auditoría por cada cosa
      que se toca en el panel. Una vez por día alcanza de sobra.
    */
    name: "purge",
    intervalSeconds: 86400,
    opportunistic: true,
    run: purgeOldRows,
  },
  {
    // Once an hour is plenty for something with a month of runway, and it keeps
    // a failing link from being retried against MercadoPago every few minutes.
    name: "mercadopago-renewal",
    intervalSeconds: 3600,
    opportunistic: true,
    run: renewMercadoPagoLinks,
  },
];
