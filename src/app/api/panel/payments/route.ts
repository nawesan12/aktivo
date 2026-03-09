import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "payments:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(searchParams.get("pageSize") || "20"), 100);
    const skip = (page - 1) * pageSize;

    const where = { businessId: session.businessId };

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

    return NextResponse.json({
      data: payments,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
