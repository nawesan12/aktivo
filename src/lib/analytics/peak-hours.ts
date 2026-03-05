import { db } from "@/lib/db";

interface PeakHoursData {
  heatmap: number[][]; // 7 rows (days) × 24 cols (hours)
  busiestDay: number;
  busiestHour: number;
  totalAppointments: number;
}

/**
 * Generate a 7×24 heatmap of appointment density.
 * Rows = day of week (0=Sunday), Cols = hour (0-23).
 */
export async function getPeakHoursData(
  businessId: string,
  days: number = 90
): Promise<PeakHoursData> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const appointments = await db.appointment.findMany({
    where: {
      businessId,
      dateTime: { gte: since },
      status: { in: ["COMPLETED", "CONFIRMED", "PENDING"] },
    },
    select: { dateTime: true },
  });

  // Initialize 7×24 grid
  const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  let maxCount = 0;
  let busiestDay = 0;
  let busiestHour = 0;

  for (const apt of appointments) {
    const dt = new Date(apt.dateTime);
    const day = dt.getDay();
    const hour = dt.getHours();
    heatmap[day][hour]++;

    if (heatmap[day][hour] > maxCount) {
      maxCount = heatmap[day][hour];
      busiestDay = day;
      busiestHour = hour;
    }
  }

  return {
    heatmap,
    busiestDay,
    busiestHour,
    totalAppointments: appointments.length,
  };
}
