import { db } from "@/lib/db";

interface MonthlyRetention {
  month: string; // "YYYY-MM"
  totalClients: number;
  returningClients: number;
  retentionRate: number; // 0-100
}

/**
 * Calculate monthly client retention rate.
 * A returning client is one who had appointments in both the given month
 * and at least one previous month.
 *
 * Uses a single query to fetch all appointments in the date range,
 * then groups by month in JS to avoid N+1 queries.
 */
export async function getRetentionData(
  businessId: string,
  months: number = 6
): Promise<MonthlyRetention[]> {
  // Calculate the full date range (one extra month for "previous" comparison)
  const rangeStart = new Date();
  rangeStart.setMonth(rangeStart.getMonth() - months, 1);
  rangeStart.setHours(0, 0, 0, 0);

  const rangeEnd = new Date();
  rangeEnd.setMonth(rangeEnd.getMonth() + 1, 1);
  rangeEnd.setHours(0, 0, 0, 0);

  // Single query for all appointments in range
  const appointments = await db.appointment.findMany({
    where: {
      businessId,
      dateTime: { gte: rangeStart, lt: rangeEnd },
      status: { in: ["COMPLETED", "CONFIRMED", "PENDING"] },
    },
    select: {
      userId: true,
      guestClientId: true,
      dateTime: true,
    },
  });

  // Group clients by month key "YYYY-MM"
  const monthlyClients = new Map<string, Set<string>>();

  for (const apt of appointments) {
    const d = apt.dateTime;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const clientKey = apt.userId || apt.guestClientId || "";
    if (!clientKey) continue;

    if (!monthlyClients.has(key)) monthlyClients.set(key, new Set());
    monthlyClients.get(key)!.add(clientKey);
  }

  // Build results
  const results: MonthlyRetention[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);

    const prevMonth = new Date(monthStart);
    prevMonth.setMonth(prevMonth.getMonth() - 1);

    const currentKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`;
    const prevKey = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

    const currentClients = monthlyClients.get(currentKey) || new Set();
    const prevClients = monthlyClients.get(prevKey) || new Set();

    const returning = [...currentClients].filter((c) => prevClients.has(c));
    const total = currentClients.size;
    const rate = total > 0 ? Math.round((returning.length / total) * 100) : 0;

    results.push({
      month: currentKey,
      totalClients: total,
      returningClients: returning.length,
      retentionRate: rate,
    });
  }

  return results;
}
