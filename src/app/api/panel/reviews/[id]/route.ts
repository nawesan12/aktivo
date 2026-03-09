import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reviews:manage");
    const { id } = await params;

    const body = await request.json();
    const { isVisible } = body;

    const review = await db.review.update({
      where: { id, businessId: session.businessId },
      data: { isVisible },
    });

    return NextResponse.json(review);
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
    requirePermission(session.role, "reviews:manage");
    const { id } = await params;

    await db.review.delete({
      where: { id, businessId: session.businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
