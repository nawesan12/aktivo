import { db } from "@/lib/db";

interface RevenueTimeline {
  period: string;
  revenue: number;
  count: number;
}

interface RevenueBreakdown {
  name: string;
  revenue: number;
  count: number;
}

interface RevenueData {
  timeline: RevenueTimeline[];
  byService: RevenueBreakdown[];
  byStaff: RevenueBreakdown[];
  totalRevenue: number;
  totalAppointments: number;
}

export async function getRevenueData(
  businessId: string,
  options: {
    startDate: Date;
    endDate: Date;
    groupBy?: "day" | "week" | "month";
  }
): Promise<RevenueData> {
  const { startDate, endDate, groupBy = "day" } = options;

  const appointments = await db.appointment.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      dateTime: { gte: startDate, lte: endDate },
    },
    select: {
      dateTime: true,
      service: { select: { name: true, price: true } },
      staff: { select: { name: true } },
    },
  });

  // Timeline grouping
  const timelineMap = new Map<string, { revenue: number; count: number }>();
  const serviceMap = new Map<string, { revenue: number; count: number }>();
  const staffMap = new Map<string, { revenue: number; count: number }>();

  let totalRevenue = 0;

  for (const apt of appointments) {
    const price = Number(apt.service.price) || 0;
    totalRevenue += price;

    // Timeline key
    const dt = apt.dateTime;
    let periodKey: string;
    if (groupBy === "month") {
      periodKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    } else if (groupBy === "week") {
      // ISO week start (Monday)
      const d = new Date(dt);
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      periodKey = d.toISOString().slice(0, 10);
    } else {
      periodKey = dt.toISOString().slice(0, 10);
    }

    const existing = timelineMap.get(periodKey) || { revenue: 0, count: 0 };
    existing.revenue += price;
    existing.count++;
    timelineMap.set(periodKey, existing);

    // Service breakdown
    const svc = serviceMap.get(apt.service.name) || { revenue: 0, count: 0 };
    svc.revenue += price;
    svc.count++;
    serviceMap.set(apt.service.name, svc);

    // Staff breakdown
    const stf = staffMap.get(apt.staff.name) || { revenue: 0, count: 0 };
    stf.revenue += price;
    stf.count++;
    staffMap.set(apt.staff.name, stf);
  }

  const timeline = [...timelineMap.entries()]
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const byService = [...serviceMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  const byStaff = [...staffMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.revenue - a.revenue);

  return {
    timeline,
    byService,
    byStaff,
    totalRevenue,
    totalAppointments: appointments.length,
  };
}
