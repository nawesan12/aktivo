import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { revalidateBusinessPage } from "@/lib/booking/business-page";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const { id } = await params;

    // Scoped in the `where`: a photo id from another business must not delete.
    const deleted = await db.businessPhoto.deleteMany({
      where: { id, businessId: session.businessId },
    });

    if (deleted.count === 0) throw new NotFoundError("Foto no encontrada");

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { slug: true },
    });
    revalidateBusinessPage(business?.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "panel:mi-web:galeria:DELETE");
  }
}
