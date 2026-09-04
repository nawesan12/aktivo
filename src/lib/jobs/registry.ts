import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { sendDueReminders } from "@/lib/reminders/send";
import { autoMarkNoShows } from "@/lib/no-show";
import { redeliverFailedNotifications } from "@/lib/notifications/redelivery";
import { sendPendingReviewRequests } from "@/lib/reviews/requests";
import { runScheduledCampaigns } from "@/lib/campaigns/run";
import { renewMercadoPagoLinks } from "@/lib/mercadopago-renewal";

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
    // Once an hour is plenty for something with a month of runway, and it keeps
    // a failing link from being retried against MercadoPago every few minutes.
    name: "mercadopago-renewal",
    intervalSeconds: 3600,
    opportunistic: true,
    run: renewMercadoPagoLinks,
  },
  {
    // Daily cron only. A birthday greeting has to go out on the day; if it
    // waited for traffic and that day was quiet, it would be lost for good and
    // in silence.
    name: "campaigns",
    intervalSeconds: 43200,
    opportunistic: false,
    run: runScheduledCampaigns,
  },
];
