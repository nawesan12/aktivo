import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "group:reports");

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { groupId: true },
    });

    if (!business?.groupId) {
      return NextResponse.json({ error: "No pertenece a un grupo" }, { status: 400 });
    }

    const { searchParams } = request.nextUrl;
    const range = searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Get all locations in the group
    const locations = await db.business.findMany({
      where: { groupId: business.groupId, isActive: true },
      select: { id: true, name: true, slug: true },
    });

    const locationIds = locations.map((l) => l.id);

    // 3 bulk queries instead of N*3
    const [appointmentCounts, revenueSums, clientGroups] = await Promise.all([
      db.appointment.groupBy({
        by: ["businessId"],
        where: { businessId: { in: locationIds }, dateTime: { gte: since } },
        _count: true,
      }),
      db.payment.groupBy({
        by: ["businessId"],
        where: {
          businessId: { in: locationIds },
          status: "APPROVED",
          createdAt: { gte: since },
        },
        _sum: { amount: true },
      }),
      db.appointment.groupBy({
        by: ["businessId", "userId", "guestClientId"],
        where: { businessId: { in: locationIds }, dateTime: { gte: since } },
      }),
    ]);

    // Build lookup maps
    const apptMap = new Map(appointmentCounts.map((r) => [r.businessId, r._count]));
    const revMap = new Map(revenueSums.map((r) => [r.businessId, r._sum.amount || 0]));
    const clientCountMap = new Map<string, number>();
    for (const row of clientGroups) {
      clientCountMap.set(row.businessId, (clientCountMap.get(row.businessId) || 0) + 1);
    }

    const locationStats = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      slug: loc.slug,
      appointments: apptMap.get(loc.id) || 0,
      revenue: revMap.get(loc.id) || 0,
      uniqueClients: clientCountMap.get(loc.id) || 0,
    }));

    // Totals
    const totals = locationStats.reduce(
      (acc, loc) => ({
        appointments: acc.appointments + loc.appointments,
        revenue: acc.revenue + loc.revenue,
        uniqueClients: acc.uniqueClients + loc.uniqueClients,
      }),
      { appointments: 0, revenue: 0, uniqueClients: 0 }
    );

    return NextResponse.json({
      totals,
      locations: locationStats,
      locationCount: locationIds.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
