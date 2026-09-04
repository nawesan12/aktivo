import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "clients:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search");
    const tagId = searchParams.get("tag");

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
    if (tagId) {
      userWhere.tagAssignments = { some: { tagId } };
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
    if (tagId) {
      guestWhere.tagAssignments = { some: { tagId } };
    }

    // Fetch paginated: take enough from both tables to fill one page
    // We over-fetch by pageSize from each to ensure we can fill the merged page
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
            // The last visit, not the next booking: "hace 12 días" is what the
            // column says, and ordering by dateTime alone put a turno booked
            // for next week in there and printed "hace -4 días".
            where: { businessId: session.businessId, dateTime: { lte: new Date() } },
            orderBy: { dateTime: "desc" },
            take: 1,
            select: { dateTime: true },
          },
          tagAssignments: {
            where: { tag: { businessId: session.businessId } },
            select: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
        orderBy: { name: "asc" },
        take: page * pageSize,
      }),
      db.guestClient.findMany({
        where: guestWhere,
        include: {
          _count: { select: { appointments: true } },
          appointments: {
            where: { dateTime: { lte: new Date() } },
            orderBy: { dateTime: "desc" },
            take: 1,
            select: { dateTime: true },
          },
          tagAssignments: {
            where: { tag: { businessId: session.businessId } },
            select: { tag: { select: { id: true, name: true, color: true } } },
          },
        },
        orderBy: { name: "asc" },
        take: page * pageSize,
      }),
      db.user.count({ where: userWhere }),
      db.guestClient.count({ where: guestWhere }),
    ]);

    /*
      "Gastado" per client, aggregated in one query for the whole page rather
      than one per row. Same definition the client's own card uses: payments
      that actually cleared, not prices of bookings that may never have been
      paid for.
    */
    const spendRows = await db.payment.groupBy({
      by: ["appointmentId"],
      where: { businessId: session.businessId, status: "APPROVED" },
      _sum: { amount: true },
    });
    const spentByAppointment = new Map(
      spendRows.map((row) => [row.appointmentId, row._sum.amount ?? 0])
    );
    const owners = await db.appointment.findMany({
      where: {
        businessId: session.businessId,
        id: { in: [...spentByAppointment.keys()] },
      },
      select: { id: true, userId: true, guestClientId: true },
    });
    const spentByClient = new Map<string, number>();
    for (const appointment of owners) {
      const clientId = appointment.userId ?? appointment.guestClientId;
      if (!clientId) continue;
      spentByClient.set(
        clientId,
        (spentByClient.get(clientId) ?? 0) + (spentByAppointment.get(appointment.id) ?? 0)
      );
    }

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
        totalSpent: spentByClient.get(u.id) ?? 0,
        tags: u.tagAssignments.map((assignment) => assignment.tag),
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
        totalSpent: spentByClient.get(g.id) ?? 0,
        tags: g.tagAssignments.map((assignment) => assignment.tag),
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
    return handleApiError(error);
  }
}
