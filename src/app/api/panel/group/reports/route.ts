import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

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

    // Aggregate stats per location
    const locationStats = await Promise.all(
      locations.map(async (loc) => {
        const [appointments, revenue, clients] = await Promise.all([
          db.appointment.count({
            where: { businessId: loc.id, dateTime: { gte: since } },
          }),
          db.payment.aggregate({
            where: {
              businessId: loc.id,
              status: "APPROVED",
              createdAt: { gte: since },
            },
            _sum: { amount: true },
          }),
          db.appointment.groupBy({
            by: ["userId", "guestClientId"],
            where: { businessId: loc.id, dateTime: { gte: since } },
          }),
        ]);

        return {
          id: loc.id,
          name: loc.name,
          slug: loc.slug,
          appointments,
          revenue: revenue._sum.amount || 0,
          uniqueClients: clients.length,
        };
      })
    );

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
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
