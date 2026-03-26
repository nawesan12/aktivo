import { db } from "@/lib/db";

interface ClientLTV {
  clientId: string;
  clientName: string;
  type: "registered" | "guest";
  totalRevenue: number;
  totalAppointments: number;
  firstVisit: Date;
  lastVisit: Date;
  monthsActive: number;
  ltv: number; // totalRevenue / monthsActive
}

/**
 * Calculate Client Lifetime Value.
 * LTV = total revenue / months active.
 */
export async function getLTVData(
  businessId: string,
  options: { limit?: number; startDate?: Date; endDate?: Date } = {}
): Promise<{ clients: ClientLTV[]; averageLTV: number }> {
  const { limit = 20, startDate, endDate } = options;

  // Get completed appointments with payment info (bounded to last 2 years or custom range)
  const rangeStart = startDate || (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 2); return d; })();

  const dateTimeFilter: { gte: Date; lte?: Date } = { gte: rangeStart };
  if (endDate) dateTimeFilter.lte = endDate;

  const appointments = await db.appointment.findMany({
    where: {
      businessId,
      status: "COMPLETED",
      dateTime: dateTimeFilter,
    },
    select: {
      userId: true,
      guestClientId: true,
      dateTime: true,
      service: { select: { price: true } },
      user: { select: { name: true } },
      guestClient: { select: { name: true } },
    },
    orderBy: { dateTime: "asc" },
  });

  // Group by client
  const clientMap = new Map<string, {
    name: string;
    type: "registered" | "guest";
    revenue: number;
    count: number;
    firstVisit: Date;
    lastVisit: Date;
  }>();

  for (const apt of appointments) {
    const key = apt.userId || apt.guestClientId || "unknown";
    const existing = clientMap.get(key);

    if (existing) {
      existing.revenue += apt.service.price;
      existing.count++;
      if (apt.dateTime > existing.lastVisit) existing.lastVisit = apt.dateTime;
    } else {
      clientMap.set(key, {
        name: apt.user?.name || apt.guestClient?.name || "Sin nombre",
        type: apt.userId ? "registered" : "guest",
        revenue: apt.service.price,
        count: 1,
        firstVisit: apt.dateTime,
        lastVisit: apt.dateTime,
      });
    }
  }

  // Calculate LTV
  const clients: ClientLTV[] = [];

  for (const [clientId, data] of clientMap.entries()) {
    const monthsDiff = Math.max(
      1,
      (data.lastVisit.getTime() - data.firstVisit.getTime()) / (30 * 24 * 60 * 60 * 1000) + 1
    );

    clients.push({
      clientId,
      clientName: data.name,
      type: data.type,
      totalRevenue: data.revenue,
      totalAppointments: data.count,
      firstVisit: data.firstVisit,
      lastVisit: data.lastVisit,
      monthsActive: Math.round(monthsDiff),
      ltv: Math.round(data.revenue / monthsDiff),
    });
  }

  clients.sort((a, b) => b.ltv - a.ltv);

  const averageLTV = clients.length > 0
    ? Math.round(clients.reduce((sum, c) => sum + c.ltv, 0) / clients.length)
    : 0;

  return {
    clients: clients.slice(0, limit),
    averageLTV,
  };
}
