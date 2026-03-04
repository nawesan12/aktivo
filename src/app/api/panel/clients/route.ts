import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search");

    // Get registered users who have appointments with this business
    const userWhere: Record<string, unknown> = {
      appointments: { some: { businessId: session.businessId } },
    };
    if (search) {
      userWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Get guest clients for this business
    const guestWhere: Record<string, unknown> = {
      businessId: session.businessId,
    };
    if (search) {
      guestWhere.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, guests, userCount, guestCount] = await Promise.all([
      db.user.findMany({
        where: userWhere,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: {
            select: { appointments: { where: { businessId: session.businessId } } },
          },
          appointments: {
            where: { businessId: session.businessId },
            orderBy: { dateTime: "desc" },
            take: 1,
            select: { dateTime: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.guestClient.findMany({
        where: guestWhere,
        include: {
          _count: { select: { appointments: true } },
          appointments: {
            orderBy: { dateTime: "desc" },
            take: 1,
            select: { dateTime: true },
          },
        },
        orderBy: { name: "asc" },
      }),
      db.user.count({ where: userWhere }),
      db.guestClient.count({ where: guestWhere }),
    ]);

    // Merge and normalize
    const merged = [
      ...users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        type: "registered" as const,
        totalAppointments: u._count.appointments,
        lastAppointment: u.appointments[0]?.dateTime || null,
        createdAt: u.createdAt,
      })),
      ...guests.map((g) => ({
        id: g.id,
        name: g.name,
        email: g.email,
        phone: g.phone,
        type: "guest" as const,
        totalAppointments: g._count.appointments,
        lastAppointment: g.appointments[0]?.dateTime || null,
        createdAt: g.createdAt,
      })),
    ].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const total = userCount + guestCount;
    const paginated = merged.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      data: paginated,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
