import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBusinesses,
      totalUsers,
      appointmentsThisMonth,
      revenueResult,
      recentBusinesses,
    ] = await Promise.all([
      db.business.count(),
      db.user.count(),
      db.appointment.count({ where: { dateTime: { gte: startOfMonth } } }),
      db.payment.aggregate({
        where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      db.business.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, slug: true, plan: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      totalBusinesses,
      totalUsers,
      appointmentsThisMonth,
      revenueThisMonth: revenueResult._sum.amount || 0,
      recentBusinesses,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
