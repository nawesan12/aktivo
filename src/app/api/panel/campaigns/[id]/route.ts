import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:read");
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        executions: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: { select: { name: true } },
            guestClient: { select: { name: true } },
          },
        },
        _count: { select: { executions: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    return NextResponse.json(campaign);
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
    requirePermission(session.role, "campaigns:manage");
    const { id } = await params;

    const body = await request.json();
    const { name, status: newStatus, messageSubject, messageBody, triggerConfig, targetTagIds, channel } = body;

    const campaign = await db.campaign.update({
      where: { id, businessId: session.businessId },
      data: {
        ...(name && { name: name.trim() }),
        ...(newStatus && { status: newStatus }),
        ...(messageSubject !== undefined && { messageSubject }),
        ...(messageBody && { messageBody: messageBody.trim() }),
        ...(triggerConfig !== undefined && { triggerConfig }),
        ...(targetTagIds && { targetTagIds }),
        ...(channel && { channel }),
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:manage");
    const { id } = await params;

    await db.campaign.delete({
      where: { id, businessId: session.businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
