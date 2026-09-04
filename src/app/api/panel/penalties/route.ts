import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:read");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10));

    const where = {
      businessId: session.businessId,
      blockedUntil: { gt: new Date() },
      liftedAt: null,
    };

    const [penalties, total] = await Promise.all([
      db.clientPenalty.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          guestClient: { select: { name: true, phone: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.clientPenalty.count({ where }),
    ]);

    return NextResponse.json({ penalties, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}
