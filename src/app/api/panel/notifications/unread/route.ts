import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "notifications:read");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    /*
      Lo que entró desde la última vez que lo miró.

      El contador era un conteo de los envíos de las últimas 24 horas, así que
      no bajaba al abrir la campanita: bajaba solo, con el paso del tiempo. Sin
      marca previa —nunca la abrió— se cuenta la misma ventana de siete días que
      muestra la lista, para no arrancar con un número inventado.
    */
    const settings = await db.businessSettings.findUnique({
      where: { businessId: session.businessId },
      select: { notificationsSeenAt: true },
    });
    const desde = settings?.notificationsSeenAt ?? sevenDaysAgo;

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
          createdAt: { gt: desde },
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
