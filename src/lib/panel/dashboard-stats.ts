import { format } from "date-fns";

import { db } from "@/lib/db";
import { ARGENTINA_TZ, nowInArgentina } from "@/lib/timezone";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
} from "date-fns";

/**
 * The calendar day a grouped row belongs to, as `yyyy-MM-dd`.
 *
 * `AT TIME ZONE` returns a naive `timestamp`, and node-postgres reads those as
 * UTC — so a row for Buenos Aires midnight arrives as `2026-09-04T00:00:00Z`.
 * Reading it back with a local-time formatter moves it to the 3rd, which shifted
 * the whole week one bar to the left. The value is already in the business's
 * day; the only correct way to read it is in UTC.
 */
function bucketKey(value: Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

/**
 * The dashboard's numbers.
 *
 * Lives here rather than inside the route handler so the panel page can run it
 * on the server and render with data already in place, instead of shipping a
 * skeleton and fetching afterwards. The API route stays for the client-side
 * revalidation that SWR does every minute.
 */
export async function getDashboardStats(businessId: string) {
  const now = nowInArgentina();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayEnd = endOfDay(subDays(now, 1));

  const [
    todayCount,
    yesterdayCount,
    monthRevenue,
    prevMonthRevenue,
    activeClients,
    prevMonthClients,
    monthAppointments,
    monthSlots,
    last7Days,
    last6Months,
    upcoming,
    recentAudit,
    waitlistByDay,
  ] = await Promise.all([
    // Today's appointments
    db.appointment.count({
      where: {
        businessId: businessId,
        dateTime: { gte: todayStart, lte: todayEnd },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Yesterday's appointments
    db.appointment.count({
      where: {
        businessId: businessId,
        dateTime: { gte: yesterdayStart, lte: yesterdayEnd },
        status: { notIn: ["CANCELLED"] },
      },
    }),
    // Month revenue
    db.payment.aggregate({
      where: {
        businessId: businessId,
        status: "APPROVED",
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    // Previous month revenue
    db.payment.aggregate({
      where: {
        businessId: businessId,
        status: "APPROVED",
        createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
      _sum: { amount: true },
    }),
    // Active clients (with appointments this month) — groupBy instead of findMany+distinct
    db.appointment.groupBy({
      by: ["userId", "guestClientId"],
      where: {
        businessId: businessId,
        dateTime: { gte: monthStart, lte: monthEnd },
      },
    }),
    // Previous month clients
    db.appointment.groupBy({
      by: ["userId", "guestClientId"],
      where: {
        businessId: businessId,
        dateTime: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    }),
    // Month total appointments (for occupancy)
    db.appointment.count({
      where: {
        businessId: businessId,
        dateTime: { gte: monthStart, lte: monthEnd },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
    }),
    // Total possible slots (staff * working days * slots/day) - approximate
    db.staffMember.count({
      where: { businessId: businessId, isActive: true },
    }),
    // Last 7 days — single raw query grouped by date
    db.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC('day', ("dateTime" AT TIME ZONE 'UTC') AT TIME ZONE ${ARGENTINA_TZ}) as day, COUNT(*)::bigint as count
      FROM "Appointment"
      WHERE "businessId" = ${businessId}
        AND "dateTime" >= ${startOfDay(subDays(now, 6))}
        AND "dateTime" <= ${todayEnd}
        AND "status" != 'CANCELLED'
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    // Last 6 months revenue — single raw query grouped by month
    db.$queryRaw<{ month: Date; revenue: number }[]>`
      SELECT DATE_TRUNC('month', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${ARGENTINA_TZ}) as month, COALESCE(SUM(amount), 0)::float as revenue
      FROM "Payment"
      WHERE "businessId" = ${businessId}
        AND "status" = 'APPROVED'
        AND "createdAt" >= ${startOfMonth(subMonths(now, 5))}
        AND "createdAt" <= ${monthEnd}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
    // Next 5 upcoming appointments
    db.appointment.findMany({
      where: {
        businessId: businessId,
        dateTime: { gte: now },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      orderBy: { dateTime: "asc" },
      take: 5,
      include: {
        service: { select: { name: true } },
        staff: { select: { name: true } },
        user: { select: { name: true } },
        guestClient: { select: { name: true } },
      },
    }),
    // Recent audit log
    db.auditLog.findMany({
      where: { businessId: businessId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    // The day the most people are still waiting for. Entries already notified
    // or past their expiry are not waiting on anybody.
    db.waitlistEntry.groupBy({
      by: ["preferredDate"],
      where: {
        businessId: businessId,
        notified: false,
        expiresAt: { gt: now },
        preferredDate: { gte: todayStart },
      },
      _count: { _all: true },
      orderBy: { _count: { preferredDate: "desc" } },
      take: 1,
    }),
  ]);

  const currentRevenue = monthRevenue._sum.amount || 0;
  const previousRevenue = prevMonthRevenue._sum.amount || 0;
  const revenueChange = previousRevenue > 0
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : 0;

  const clientCount = activeClients.length;
  const prevClientCount = prevMonthClients.length;
  const clientChange = clientCount - prevClientCount;

  // Approximate occupancy: appointments / (staff * 22 working days * 8 slots/day)
  const estimatedCapacity = Math.max(monthSlots * 22 * 8, 1);
  const occupancy = Math.min(Math.round((monthAppointments / estimatedCapacity) * 100), 100);

  /*
    Both sides of these lookups are keyed by the calendar day as written in the
    business's timezone, never by an instant.

    They used to be keyed by `.toISOString()` on two values that were built
    differently: Postgres truncated the day in UTC, and the chart's axis
    truncated it against `nowInArgentina()`, three hours away. The keys could
    not match, so every bar on "Turnos por día" and every column of "Ingresos
    mensuales" read zero no matter how busy the week had been.

    The double AT TIME ZONE in the queries is not redundant: the columns are
    `timestamp without time zone` holding UTC, so the first one labels them as
    UTC and the second moves them into the business's day.
  */
  const dayMap = new Map<string, number>();
  for (const row of last7Days) {
    dayMap.set(bucketKey(row.day), Number(row.count));
  }
  const last7DaysChart = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(subDays(now, 6 - i));
    return { date: day.toISOString(), count: dayMap.get(format(day, "yyyy-MM-dd")) ?? 0 };
  });

  // Build last6Months from grouped raw data
  const monthRevMap = new Map<string, number>();
  for (const row of last6Months) {
    monthRevMap.set(bucketKey(row.month).slice(0, 7), row.revenue);
  }
  const last6MonthsChart = Array.from({ length: 6 }, (_, i) => {
    const month = startOfMonth(subMonths(now, 5 - i));
    return { month: month.toISOString(), revenue: monthRevMap.get(format(month, "yyyy-MM")) ?? 0 };
  });

  return {
      kpis: {
        todayAppointments: todayCount,
        todayChange: todayCount - yesterdayCount,
        monthRevenue: currentRevenue,
        revenueChange,
        activeClients: clientCount,
        clientChange,
        occupancy,
      },
      charts: {
        last7Days: last7DaysChart,
        last6Months: last6MonthsChart,
      },
      upcoming: upcoming.map((a) => ({
        id: a.id,
        clientName: a.user?.name || a.guestClient?.name || "Sin nombre",
        serviceName: a.service.name,
        staffName: a.staff.name,
        // ISO strings, not Date objects: this same shape travels through the API
        // as JSON, so the components must not care which path it took.
        dateTime: a.dateTime.toISOString(),
        status: a.status,
      })),
      /*
        The one thing on this screen that asks for an action rather than
        reporting a number: people are queued for a day and nobody has offered
        them anything. Null when the queue is empty, and the banner disappears
        with it.
      */
      waitlistInsight: waitlistByDay[0]
        ? {
            date: waitlistByDay[0].preferredDate.toISOString(),
            people: waitlistByDay[0]._count._all,
          }
        : null,
      recentActivity: recentAudit.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        userName: log.user?.name || "Sistema",
        createdAt: log.createdAt.toISOString(),
        details: log.details,
      })),
    };
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>;
