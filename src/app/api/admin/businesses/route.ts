import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("q") || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          isActive: true,
          createdAt: true,
          _count: { select: { members: true, appointments: true } },
          subscriptions: {
            where: { status: { in: ["AUTHORIZED", "PAUSED", "PENDING"] } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      }),
      db.business.count({ where }),
    ]);

    const data = businesses.map((b) => ({
      ...b,
      subscriptionStatus: b.subscriptions[0]?.status || null,
      subscriptions: undefined,
    }));

    return NextResponse.json({
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin businesses error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
