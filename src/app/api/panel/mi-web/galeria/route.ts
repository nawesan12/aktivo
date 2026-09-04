import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, ConflictError } from "@/lib/api-errors";
import { revalidateBusinessPage } from "@/lib/booking/business-page";

/**
 * The photo gallery of a business's public page.
 *
 * The model and the public rendering were both already there; nothing ever
 * wrote to it, so every business's page showed an empty gallery it had no way
 * to fill.
 */
const MAX_PHOTOS = 12;

const photoSchema = z.object({
  url: z.string().url("La imagen no se subió bien"),
  caption: z.string().trim().max(120).optional().nullable(),
});

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:read");

    const photos = await db.businessPhoto.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: photos, max: MAX_PHOTOS });
  } catch (error) {
    return handleApiError(error, "panel:mi-web:galeria:GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const input = photoSchema.parse(await request.json());

    const count = await db.businessPhoto.count({ where: { businessId: session.businessId } });
    if (count >= MAX_PHOTOS) {
      throw new ConflictError(`Podés tener hasta ${MAX_PHOTOS} fotos. Borrá una para subir otra.`);
    }

    const photo = await db.businessPhoto.create({
      data: {
        businessId: session.businessId,
        url: input.url,
        caption: input.caption || null,
        sortOrder: count,
      },
    });

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { slug: true },
    });
    revalidateBusinessPage(business?.slug);

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    return handleApiError(error, "panel:mi-web:galeria:POST");
  }
}
