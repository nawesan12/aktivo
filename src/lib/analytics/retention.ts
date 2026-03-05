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
 */
export async function getRetentionData(
  businessId: string,
  months: number = 6
): Promise<MonthlyRetention[]> {
  const results: MonthlyRetention[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - i, 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const prevStart = new Date(monthStart);
    prevStart.setMonth(prevStart.getMonth() - 1);

    // Clients active this month
    const thisMonthClients = await db.appointment.groupBy({
      by: ["userId", "guestClientId"],
      where: {
        businessId,
        dateTime: { gte: monthStart, lt: monthEnd },
        status: { in: ["COMPLETED", "CONFIRMED", "PENDING"] },
      },
    });

    // Clients active in previous month
    const prevMonthClients = await db.appointment.groupBy({
      by: ["userId", "guestClientId"],
      where: {
        businessId,
        dateTime: { gte: prevStart, lt: monthStart },
        status: { in: ["COMPLETED", "CONFIRMED", "PENDING"] },
      },
    });

    // Find returning clients (in both months)
    const prevSet = new Set(
      prevMonthClients.map((c) => c.userId || c.guestClientId || "")
    );
    const returning = thisMonthClients.filter(
      (c) => prevSet.has(c.userId || c.guestClientId || "")
    );

    const total = thisMonthClients.length;
    const rate = total > 0 ? Math.round((returning.length / total) * 100) : 0;

    results.push({
      month: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, "0")}`,
      totalClients: total,
      returningClients: returning.length,
      retentionRate: rate,
    });
  }

  return results;
}
