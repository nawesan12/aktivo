import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reviews:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const rating = searchParams.get("rating");
    const visible = searchParams.get("visible");

    const where: Record<string, unknown> = {
      businessId: session.businessId,
    };

    if (rating) {
      where.rating = parseInt(rating);
    }
    if (visible === "true") where.isVisible = true;
    if (visible === "false") where.isVisible = false;

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          appointment: {
            include: {
              service: { select: { name: true } },
              staff: { select: { name: true } },
            },
          },
          user: { select: { id: true, name: true, image: true } },
          guestClient: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.review.count({ where }),
    ]);

    // Compute average rating
    const stats = await db.review.aggregate({
      where: { businessId: session.businessId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return NextResponse.json({
      data: reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.rating,
      },
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
