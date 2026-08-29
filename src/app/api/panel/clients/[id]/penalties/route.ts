import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { liftPenalty } from "@/lib/no-show";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "noshow:read");
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    const where = user
      ? { businessId: session.businessId, userId: id }
      : { businessId: session.businessId, guestClientId: id };

    const penalties = await db.clientPenalty.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: penalties });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "noshow:manage");
    const { id: clientId } = await params;

    const body = await request.json();
    const { penaltyId } = body;

    if (!penaltyId) {
      return NextResponse.json({ error: "penaltyId requerido" }, { status: 400 });
    }

    // penaltyId comes from the request body: it must be confirmed to belong to
    // this business *and* this client before lifting it. Same check as
    // /api/panel/penalties/[id].
    // The client id may be either a User or a GuestClient, as in the GET above.
    const existing = await db.clientPenalty.findFirst({
      where: {
        id: penaltyId,
        businessId: session.businessId,
        OR: [{ userId: clientId }, { guestClientId: clientId }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Penalización no encontrada" }, { status: 404 });
    }

    if (existing.liftedAt !== null) {
      return NextResponse.json(
        { error: "Esta penalización ya fue levantada" },
        { status: 400 }
      );
    }

    const penalty = await liftPenalty(penaltyId, session.userId);

    return NextResponse.json(penalty);
  } catch (error) {
    return handleApiError(error);
  }
}
