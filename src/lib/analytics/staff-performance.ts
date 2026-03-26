import { db } from "@/lib/db";

interface StaffPerformance {
  staffId: string;
  staffName: string;
  completedCount: number;
  revenue: number;
  avgRating: number | null;
  cancelledCount: number;
  noShowCount: number;
}

export async function getStaffPerformanceData(
  businessId: string,
  options: { startDate: Date; endDate: Date }
): Promise<StaffPerformance[]> {
  const { startDate, endDate } = options;

  const staff = await db.staffMember.findMany({
    where: { businessId, isActive: true },
    select: {
      id: true,
      name: true,
      appointments: {
        where: { dateTime: { gte: startDate, lte: endDate } },
        select: {
          status: true,
          service: { select: { price: true } },
        },
      },
    },
  });

  // Get average ratings per staff
  const reviews = await db.review.findMany({
    where: {
      businessId,
      isVisible: true,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      appointment: { select: { staffId: true } },
    },
  });

  const ratingMap = new Map<string, { total: number; count: number }>();
  for (const review of reviews) {
    const sid = review.appointment?.staffId;
    if (!sid) continue;
    const existing = ratingMap.get(sid) || { total: 0, count: 0 };
    existing.total += review.rating;
    existing.count++;
    ratingMap.set(sid, existing);
  }

  return staff.map((s) => {
    const completed = s.appointments.filter((a) => a.status === "COMPLETED");
    const cancelled = s.appointments.filter((a) => a.status === "CANCELLED");
    const noShow = s.appointments.filter((a) => a.status === "NO_SHOW");
    const revenue = completed.reduce((sum, a) => sum + (Number(a.service.price) || 0), 0);
    const rating = ratingMap.get(s.id);

    return {
      staffId: s.id,
      staffName: s.name,
      completedCount: completed.length,
      revenue,
      avgRating: rating ? Math.round((rating.total / rating.count) * 10) / 10 : null,
      cancelledCount: cancelled.length,
      noShowCount: noShow.length,
    };
  }).sort((a, b) => b.revenue - a.revenue);
}
