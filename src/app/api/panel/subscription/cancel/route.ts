import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { getPlatformPreApproval } from "@/lib/subscription/mp-platform";
import { logAction } from "@/lib/audit";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "billing:manage");

    const body = await request.json().catch(() => ({}));

    const subscription = await db.subscription.findFirst({
      where: {
        businessId: session.businessId,
        status: { in: ["AUTHORIZED", "PAUSED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!subscription) {
      throw new NotFoundError("No hay suscripción activa para cancelar");
    }

    // Cancel in MercadoPago
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
