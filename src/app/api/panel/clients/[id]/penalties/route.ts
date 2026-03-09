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
    const { id: _clientId } = await params;

    const body = await request.json();
    const { penaltyId } = body;

    if (!penaltyId) {
      return NextResponse.json({ error: "penaltyId requerido" }, { status: 400 });
    }

    const penalty = await liftPenalty(penaltyId, session.userId);

    return NextResponse.json(penalty);
  } catch (error) {
    return handleApiError(error);
  }
}
