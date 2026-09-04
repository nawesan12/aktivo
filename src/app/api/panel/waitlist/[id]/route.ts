import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:update");

    const { id } = await params;

    const entry = await db.waitlistEntry.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Entrada de lista de espera no encontrada" },
        { status: 404 }
      );
    }

    // Soft-expire instead of hard delete
    await db.waitlistEntry.update({
      where: { id },
      data: { expiresAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
