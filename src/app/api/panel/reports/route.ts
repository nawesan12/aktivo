import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: Request) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "reports:read");

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let startDate: Date;
    const endDate = dateTo ? new Date(dateTo) : new Date();

    if (dateFrom) {
      startDate = new Date(dateFrom);
    } else {
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const where = {
      businessId: session.businessId,
      dateTime: { gte: startDate, lte: endDate },
    };

    const [appointments, payments, clients] = await Promise.all([
      db.appointment.findMany({
        where,
        select: {
          id: true,
          dateTime: true,
          status: true,
          staff: { select: { id: true, name: true } },
          service: { select: { id: true, name: true, price: true } },
          payment: { select: { amount: true, status: true } },
          userId: true,
          guestClientId: true,
        },
      }),
      db.payment.findMany({
        where: {
          appointment: { businessId: session.businessId },
          createdAt: { gte: startDate, lte: endDate },
          status: "APPROVED",
        },
        select: { amount: true },
      }),
      db.appointment.findMany({
        where,
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    /*
      Billed, not collected online.

      These two used to count only approved MercadoPago payments, which in a
      shop that takes a 30% deposit means "Quién factura más" showed a third of
      what each professional actually billed — and nothing at all for a shop
      with payments switched off. What a professional billed is the price of the
      work they finished.
    */
    const billed = (a: (typeof appointments)[number]) =>
      a.status === "COMPLETED" ? Number(a.service.price) : 0;

    const staffMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of appointments) {
      const key = a.staff.id;
      const existing = staffMap.get(key) || { name: a.staff.name, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += billed(a);
      staffMap.set(key, existing);
    }

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const a of appointments) {
      const key = a.service.id;
      const existing = serviceMap.get(key) || { name: a.service.name, count: 0, revenue: 0 };
      existing.count++;
      existing.revenue += billed(a);
      serviceMap.set(key, existing);
    }

    /*
      The heatmap, and the insight that hangs off it.

      Four bands rather than every hour: a shop reads its week as mornings,
      midday, afternoon and evening, and twelve columns of one-hour cells on a
      1440px screen is a texture, not an answer. The quietest band that the shop
      is actually open for is what the banner at the top offers to fix.
    */
    const BANDS = [
      { id: "09-12", from: 9, to: 12 },
      { id: "12-15", from: 12, to: 15 },
      { id: "15-18", from: 15, to: 18 },
      { id: "18-21", from: 18, to: 21 },
    ];
    const heatmap = BANDS.map((band) => ({
      band: band.id,
      days: Array.from({ length: 6 }, (_, index) => {
        const weekday = index + 1; // lunes … sábado
        return appointments.filter((a) => {
          const when = new Date(a.dateTime);
          return (
            when.getDay() === weekday &&
            when.getHours() >= band.from &&
            when.getHours() < band.to &&
            a.status !== "CANCELLED"
          );
        }).length;
      }),
    }));

    const cells = heatmap.flatMap((row) =>
      row.days.map((count, index) => ({ band: row.band, weekday: index + 1, count }))
    );
    const busiest = [...cells].sort((a, b) => b.count - a.count)[0];
    // Only worth suggesting when the shop works that band at all somewhere in
    // the week — an empty Monday morning on a shop that opens at 15:00 is not
    // an opportunity, it is a closed door.
    const workedBands = new Set(cells.filter((cell) => cell.count > 0).map((cell) => cell.band));
    const quietest = [...cells]
      .filter((cell) => workedBands.has(cell.band))
      .sort((a, b) => a.count - b.count)[0];

    // Retention: of the clients whose first visit in the window was at least 60
    // days ago, how many came back after it.
    const byClient = new Map<string, Date[]>();
    for (const a of appointments) {
      const clientId = a.userId ?? a.guestClientId;
      if (!clientId || a.status === "CANCELLED") continue;
      byClient.set(clientId, [...(byClient.get(clientId) ?? []), a.dateTime]);
    }
    let returned = 0;
    let eligible = 0;
    for (const visits of byClient.values()) {
      const sorted = [...visits].sort((a, b) => a.getTime() - b.getTime());
      const first = sorted[0];
      if (Date.now() - first.getTime() < 60 * 86_400_000) continue;
      eligible++;
      if (sorted.some((visit) => visit.getTime() > first.getTime())) returned++;
    }

    const spendPerClient = [...byClient.entries()].map(([clientId]) =>
      appointments
        .filter((a) => (a.userId ?? a.guestClientId) === clientId)
        .reduce((sum, a) => sum + billed(a), 0)
    );
    const ltv = spendPerClient.length
      ? Math.round(spendPerClient.reduce((sum, value) => sum + value, 0) / spendPerClient.length)
      : 0;

    const finished = appointments.filter(
      (a) => a.status === "COMPLETED" || a.status === "NO_SHOW"
    ).length;
    const noShows = appointments.filter((a) => a.status === "NO_SHOW").length;

    // Timeline (group by day)
    const timelineMap = new Map<string, number>();
    for (const a of appointments) {
      const day = a.dateTime.toISOString().split("T")[0];
      timelineMap.set(day, (timelineMap.get(day) || 0) + 1);
    }

    return NextResponse.json({
      summary: {
        totalAppointments: appointments.length,
        totalRevenue,
        totalClients: clients.length,
      },
      byStaff: Array.from(staffMap.values()),
      byService: Array.from(serviceMap.values()),
      timeline: Array.from(timelineMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      heatmap,
      peak: busiest && busiest.count > 0 ? busiest : null,
      quiet: quietest && busiest && busiest.count > 0 ? quietest : null,
      retention: eligible > 0 ? Math.round((returned / eligible) * 100) : null,
      ltv,
      noShowRate: finished > 0 ? Math.round((noShows / finished) * 1000) / 10 : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
