import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { nowInArgentina } from "@/lib/timezone";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, subDays } from "date-fns";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reports:read");

    const now = nowInArgentina();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const prevMonthStart = startOfMonth(subMonths(now, 1));
    const prevMonthEnd = endOfMonth(subMonths(now, 1));
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));

    const [
      todayCount,
      yesterdayCount,
      monthRevenue,
      prevMonthRevenue,
      activeClients,
      prevMonthClients,
      monthAppointments,
      monthSlots,
      last7Days,
      last6Months,
      upcoming,
      recentAudit,
    ] = await Promise.all([
      // Today's appointments
      db.appointment.count({
        where: {
          businessId: session.businessId,
          dateTime: { gte: todayStart, lte: todayEnd },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      // Yesterday's appointments
      db.appointment.count({
        where: {
          businessId: session.businessId,
          dateTime: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      // Month revenue
      db.payment.aggregate({
        where: {
          businessId: session.businessId,
          status: "APPROVED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      // Previous month revenue
      db.payment.aggregate({
        where: {
          businessId: session.businessId,
          status: "APPROVED",
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        _sum: { amount: true },
      }),
      // Active clients (with appointments this month)
      db.appointment.findMany({
        where: {
          businessId: session.businessId,
          dateTime: { gte: monthStart, lte: monthEnd },
        },
        select: { userId: true, guestClientId: true },
        distinct: ["userId", "guestClientId"],
      }),
      // Previous month clients
      db.appointment.findMany({
        where: {
          businessId: session.businessId,
          dateTime: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        select: { userId: true, guestClientId: true },
        distinct: ["userId", "guestClientId"],
      }),
      // Month total appointments (for occupancy)
      db.appointment.count({
        where: {
          businessId: session.businessId,
          dateTime: { gte: monthStart, lte: monthEnd },
          status: { in: ["CONFIRMED", "COMPLETED"] },
        },
      }),
      // Total possible slots (staff * working days * slots/day) - approximate
      db.staffMember.count({
        where: { businessId: session.businessId, isActive: true },
      }),
      // Last 7 days appointment counts
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const day = subDays(now, 6 - i);
          return db.appointment.count({
            where: {
              businessId: session.businessId,
              dateTime: { gte: startOfDay(day), lte: endOfDay(day) },
              status: { notIn: ["CANCELLED"] },
            },
          }).then((count) => ({
            date: startOfDay(day).toISOString(),
            count,
          }));
        })
      ),
      // Last 6 months revenue
      Promise.all(
        Array.from({ length: 6 }, (_, i) => {
          const month = subMonths(now, 5 - i);
          return db.payment.aggregate({
            where: {
              businessId: session.businessId,
              status: "APPROVED",
              createdAt: { gte: startOfMonth(month), lte: endOfMonth(month) },
            },
            _sum: { amount: true },
          }).then((result) => ({
            month: startOfMonth(month).toISOString(),
            revenue: result._sum.amount || 0,
          }));
        })
      ),
      // Next 5 upcoming appointments
      db.appointment.findMany({
        where: {
          businessId: session.businessId,
          dateTime: { gte: now },
          status: { in: ["PENDING", "CONFIRMED"] },
        },
        orderBy: { dateTime: "asc" },
        take: 5,
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          user: { select: { name: true } },
          guestClient: { select: { name: true } },
        },
      }),
      // Recent audit log
      db.auditLog.findMany({
        where: { businessId: session.businessId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true } } },
      }),
    ]);

    const currentRevenue = monthRevenue._sum.amount || 0;
    const previousRevenue = prevMonthRevenue._sum.amount || 0;
    const revenueChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    const clientCount = activeClients.length;
    const prevClientCount = prevMonthClients.length;
    const clientChange = clientCount - prevClientCount;

    // Approximate occupancy: appointments / (staff * 22 working days * 8 slots/day)
    const estimatedCapacity = Math.max(monthSlots * 22 * 8, 1);
    const occupancy = Math.min(Math.round((monthAppointments / estimatedCapacity) * 100), 100);

    return NextResponse.json({
      kpis: {
        todayAppointments: todayCount,
        todayChange: todayCount - yesterdayCount,
        monthRevenue: currentRevenue,
        revenueChange,
        activeClients: clientCount,
        clientChange,
        occupancy,
      },
      charts: {
        last7Days,
        last6Months,
      },
      upcoming: upcoming.map((a) => ({
        id: a.id,
        clientName: a.user?.name || a.guestClient?.name || "Sin nombre",
        serviceName: a.service.name,
        staffName: a.staff.name,
        dateTime: a.dateTime,
        status: a.status,
      })),
      recentActivity: recentAudit.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        userName: log.user?.name || "Sistema",
        createdAt: log.createdAt,
        details: log.details,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
