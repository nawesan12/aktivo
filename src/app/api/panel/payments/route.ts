import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const skip = (page - 1) * pageSize;

    const status = searchParams.get("status");
    const where = {
      businessId: session.businessId,
      ...(status ? { status: status as never } : {}),
    };

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          appointment: {
            select: {
              dateTime: true,
              service: { select: { name: true } },
              staff: { select: { name: true } },
              user: { select: { name: true } },
              guestClient: { select: { name: true } },
            },
          },
        },
      }),
      db.payment.count({ where }),
    ]);

    /*
      The four figures at the top of the screen. They were not anywhere: the
      page opened straight onto the MercadoPago connection box and a settings
      form, so the one question an owner has here — how much came in this month
      — could only be answered by adding up the table by hand.
    */
    const [thisMonth, lastMonth, deposits, pending] = await Promise.all([
      db.payment.aggregate({
        where: {
          businessId: session.businessId,
          status: "APPROVED",
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          businessId: session.businessId,
          status: "APPROVED",
          createdAt: { gte: prevMonthStart, lt: monthStart },
        },
        _sum: { amount: true },
      }),
      db.payment.aggregate({
        where: {
          businessId: session.businessId,
          status: "APPROVED",
          mode: { in: ["PERCENTAGE", "FIXED"] },
          createdAt: { gte: monthStart },
        },
        _sum: { amount: true },
        _count: true,
      }),
      db.payment.aggregate({
        where: { businessId: session.businessId, status: "PENDING" },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const current = thisMonth._sum.amount ?? 0;
    const previous = lastMonth._sum.amount ?? 0;

    return NextResponse.json({
      data: payments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      summary: {
        collectedThisMonth: current,
        changeVsLastMonth: previous > 0 ? Math.round(((current - previous) / previous) * 100) : null,
        depositsAmount: deposits._sum.amount ?? 0,
        depositsCount: deposits._count,
        pendingAmount: pending._sum.amount ?? 0,
        pendingCount: pending._count,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
