import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { getPlatformPreApproval } from "@/lib/subscription/mp-platform";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "billing:manage");

    const body = await request.json().catch(() => ({}));

    // PENDING is in the list on purpose: it is a checkout that was started and
    // never finished, and without a way to discard one the pantalla had nothing
    // to offer someone whose attempt got stuck — "cancelala primero" pointing at
    // a button that answered "no hay suscripción activa para cancelar".
    const subscription = await db.subscription.findFirst({
      where: {
        businessId: session.businessId,
        status: { in: ["AUTHORIZED", "PAUSED", "PENDING"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      throw new NotFoundError("No hay suscripción activa para cancelar");
    }

    // Only if MercadoPago knows about it. An abandoned checkout never got a
    // preapproval id, and asking MercadoPago to cancel something it never
    // created is an error we would surface for no reason.
    if (subscription.mpPreapprovalId) {
      const preApproval = getPlatformPreApproval();
      await preApproval.update({
        id: subscription.mpPreapprovalId,
        body: { status: "cancelled" },
      });
    }

    // Update local record — business keeps plan until current period ends
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: body.reason || "Cancelado por el usuario",
      },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "subscription:cancel",
      entity: "Subscription",
      entityId: subscription.id,
      details: { plan: subscription.plan, reason: body.reason },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
