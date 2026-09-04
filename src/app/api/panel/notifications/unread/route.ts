import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "notifications:read");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [items, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: {
          businessId: session.businessId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          channel: true,
          type: true,
          status: true,
          recipient: true,
          createdAt: true,
          appointment: {
            select: {
              user: { select: { name: true } },
              guestClient: { select: { name: true } },
            },
          },
        },
      }),
      db.notification.count({
        where: {
          businessId: session.businessId,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ]);

    return NextResponse.json({
      items: items.map((n) => ({
        id: n.id,
        channel: n.channel,
        type: n.type,
        status: n.status,
        recipient: n.recipient,
        createdAt: n.createdAt,
        clientName: n.appointment?.user?.name || n.appointment?.guestClient?.name || null,
      })),
      unreadCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
