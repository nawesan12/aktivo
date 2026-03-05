import { db } from "@/lib/db";

interface AtRiskClient {
  clientId: string;
  clientName: string;
  type: "registered" | "guest";
  email: string | null;
  phone: string | null;
  lastVisit: Date;
  daysSinceLastVisit: number;
  totalAppointments: number;
  totalSpent: number;
}

/**
 * Find at-risk clients — those who haven't booked in N days.
 * Default threshold: 30 days.
 */
export async function getChurnData(
  businessId: string,
  thresholdDays: number = 30,
  limit: number = 50
): Promise<{ atRiskClients: AtRiskClient[]; totalAtRisk: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - thresholdDays);

  // Users who had appointments before cutoff but none after
  const atRiskUsers = await db.user.findMany({
    where: {
      appointments: {
        some: { businessId, status: "COMPLETED" },
        none: { businessId, dateTime: { gte: cutoff } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      appointments: {
        where: { businessId },
        orderBy: { dateTime: "desc" },
        take: 1,
        select: { dateTime: true },
      },
      _count: {
        select: { appointments: { where: { businessId } } },
      },
    },
    take: limit,
  });

  // Guest clients
  const atRiskGuests = await db.guestClient.findMany({
    where: {
      businessId,
      appointments: {
        some: { status: "COMPLETED" },
        none: { dateTime: { gte: cutoff } },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      appointments: {
        orderBy: { dateTime: "desc" },
        take: 1,
        select: { dateTime: true },
      },
      _count: { select: { appointments: true } },
    },
    take: limit,
  });

  const now = new Date();

  const clients: AtRiskClient[] = [
    ...atRiskUsers.map((u) => ({
      clientId: u.id,
      clientName: u.name || "Sin nombre",
      type: "registered" as const,
      email: u.email,
      phone: u.phone,
      lastVisit: u.appointments[0]?.dateTime || new Date(0),
      daysSinceLastVisit: Math.floor(
        (now.getTime() - (u.appointments[0]?.dateTime?.getTime() || 0)) / (24 * 60 * 60 * 1000)
      ),
      totalAppointments: u._count.appointments,
      totalSpent: 0,
    })),
    ...atRiskGuests.map((g) => ({
      clientId: g.id,
      clientName: g.name,
      type: "guest" as const,
      email: g.email,
      phone: g.phone,
      lastVisit: g.appointments[0]?.dateTime || new Date(0),
      daysSinceLastVisit: Math.floor(
        (now.getTime() - (g.appointments[0]?.dateTime?.getTime() || 0)) / (24 * 60 * 60 * 1000)
      ),
      totalAppointments: g._count.appointments,
      totalSpent: 0,
    })),
  ];

  clients.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

  return {
    atRiskClients: clients.slice(0, limit),
    totalAtRisk: clients.length,
  };
}
