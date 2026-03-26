import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import { liftPenalty } from "@/lib/no-show";

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:update");

    const { id } = await params;

    const penalty = await db.clientPenalty.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!penalty) {
      return NextResponse.json({ error: "Penalización no encontrada" }, { status: 404 });
    }

    if (penalty.blockedUntil <= new Date() || penalty.liftedAt !== null) {
      return NextResponse.json(
        { error: "Esta penalización ya fue levantada o expiró" },
        { status: 400 }
      );
    }

    const updated = await liftPenalty(id, session.userId);

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "penalty:lift",
      entity: "ClientPenalty",
      entityId: id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
