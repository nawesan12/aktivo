import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { JOBS } from "@/lib/jobs/registry";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalBusinesses,
      totalUsers,
      appointmentsThisMonth,
      appointmentsPrevMonth,
      revenueResult,
      recentBusinesses,
      businessesThisMonth,
      usersThisMonth,
      byPlan,
      jobs,
    ] = await Promise.all([
      db.business.count(),
      db.user.count(),
      db.appointment.count({ where: { dateTime: { gte: startOfMonth } } }),
      db.appointment.count({
        where: { dateTime: { gte: prevMonth, lt: startOfMonth } },
      }),
      db.payment.aggregate({
        where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.business.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, slug: true, plan: true, createdAt: true },
      }),
      db.business.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      db.business.groupBy({ by: ["plan"], _count: { _all: true } }),
      /*
        The scheduled work, as the platform actually records it. `JobRun` is the
        row each job claims before running, so "hace 4 min" is the last time the
        job really ran and not an assumption that the cron fired.
      */
      db.jobRun.findMany({
        select: { name: true, lastRunAt: true, lastEndAt: true, lastError: true, runs: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({
      totalBusinesses,
      totalUsers,
      appointmentsThisMonth,
      revenueThisMonth: revenueResult._sum.amount || 0,
      recentBusinesses,
      businessesThisMonth,
      usersThisMonth,
      appointmentsChange:
        appointmentsPrevMonth > 0
          ? Math.round(
              ((appointmentsThisMonth - appointmentsPrevMonth) / appointmentsPrevMonth) * 100
            )
          : null,
      byPlan: byPlan.map((row) => ({ plan: row.plan, count: row._count._all })),
      /*
        Freshness is decided here, not in the browser: reading the clock during
        a render makes the same data produce two different answers, and the
        server already knows what "now" means for a row it just read.
      */
      /*
        Only the jobs that still exist. `JobRun` rows outlive the code that
        wrote them — "campaigns" kept reporting "hace 21 horas" long after the
        job was deleted — so the list is filtered against the registry, plus
        `tick`, which is the opportunistic heartbeat rather than a job.
      */
      jobs: jobs
        .filter(
          (job) => job.name === "tick" || JOBS.some((registered) => registered.name === job.name)
        )
        .map((job) => ({
          name: job.name,
          lastRunAt: job.lastRunAt.toISOString(),
          lastError: job.lastError,
          runs: job.runs,
          // A day without running is the line: every job in the registry runs
          // at least daily, so anything older is not "quiet", it is stuck.
          stale: now.getTime() - job.lastRunAt.getTime() > 24 * 3_600_000,
        })),
      today: now.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "admin:stats");
  }
}
