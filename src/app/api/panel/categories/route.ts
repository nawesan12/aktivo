import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import { revalidateBusinessPage } from "@/lib/booking/business-page";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "services:read");

    const categories = await db.serviceCategory.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true } } },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "services:create");

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Nombre inválido (mínimo 2 caracteres)" }, { status: 400 });
    }

    const maxOrder = await db.serviceCategory.findFirst({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const category = await db.serviceCategory.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "category:create",
      entity: "ServiceCategory",
      entityId: category.id,
      details: { name },
    });

    // The public profile shows this. Without dropping its cache the owner
    // edits a price and keeps seeing the old one on their own page.
    revalidateBusinessPage(session.businessSlug);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
