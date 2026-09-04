import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const serviceId = searchParams.get("serviceId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {
      businessId: session.businessId,
    };

    if (serviceId) where.serviceId = serviceId;

    if (status === "pending") {
      where.notified = false;
      where.expiresAt = { gt: new Date() };
    } else if (status === "notified") {
      where.notified = true;
    } else if (status === "expired") {
      where.expiresAt = { lte: new Date() };
      where.notified = false;
    }

    const [entries, total] = await Promise.all([
      db.waitlistEntry.findMany({
        where,
        include: {
          service: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.waitlistEntry.count({ where }),
    ]);

    return NextResponse.json({
      entries,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
