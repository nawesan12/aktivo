import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reports:read");

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let startDate: Date;
    const endDate = dateTo ? new Date(dateTo) : new Date();

    if (dateFrom) {
      startDate = new Date(dateFrom);
    } else {
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const where = {
      businessId: session.businessId,
      dateTime: { gte: startDate, lte: endDate },
    };

    const [appointments, payments, clients] = await Promise.all([
      db.appointment.findMany({
        where,
        select: {
          id: true,
          dateTime: true,
          status: true,
          staff: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true } },
          payment: { select: { amount: true, status: true } },
        },
      }),
      db.payment.findMany({
        where: {
          appointment: { businessId: session.businessId },
          createdAt: { gte: startDate, lte: endDate },
          status: "APPROVED",
        },
        select: { amount: true },
      }),
      db.appointment.findMany({
        where,
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    // By staff
    const staffMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of appointments) {
      const key = a.staff.id;
      const existing = staffMap.get(key) || { name: a.staff.name, count: 0, revenue: 0 };
      existing.count++;
      if (a.payment?.status === "APPROVED") existing.revenue += a.payment.amount || 0;
      staffMap.set(key, existing);
    }

    // By service
    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of appointments) {
      const key = a.service.id;
      const existing = serviceMap.get(key) || { name: a.service.name, count: 0, revenue: 0 };
      existing.count++;
      if (a.payment?.status === "APPROVED") existing.revenue += a.payment.amount || 0;
      serviceMap.set(key, existing);
    }

    // Timeline (group by day)
    const timelineMap = new Map<string, number>();
    for (const a of appointments) {
      const day = a.dateTime.toISOString().split("T")[0];
      timelineMap.set(day, (timelineMap.get(day) || 0) + 1);
    }

    return NextResponse.json({
      summary: {
        totalAppointments: appointments.length,
        totalRevenue,
        totalClients: clients.length,
      },
      byStaff: Array.from(staffMap.values()),
      byService: Array.from(serviceMap.values()),
      timeline: Array.from(timelineMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
