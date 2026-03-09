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
    requirePermission(session.role, "clients:tags");
    const { id } = await params;

    const body = await request.json();
    const { name, color } = body;

    const tag = await db.clientTag.update({
      where: { id, businessId: session.businessId },
      data: {
        ...(name && { name: name.trim() }),
        ...(color && { color }),
      },
    });

    return NextResponse.json(tag);
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
    requirePermission(session.role, "clients:tags");
    const { id } = await params;

    await db.clientTag.delete({
      where: { id, businessId: session.businessId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
