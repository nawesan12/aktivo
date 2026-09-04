import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { settingsSchema } from "@/lib/validations";
import { revalidateBusinessPage } from "@/lib/booking/business-page";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:read");

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      include: { settings: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        logo: business.logo,
        coverImage: business.coverImage,
        address: business.address,
        city: business.city,
        province: business.province,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
        website: business.website,
        about: business.about,
        instagram: business.instagram,
        facebook: business.facebook,
        tiktok: business.tiktok,
        primaryColor: business.primaryColor,
        accentColor: business.accentColor,
      },
      settings: business.settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Datos inválidos");
    }
    const { business: businessData, settings: settingsData } = parsed.data;

    if (businessData) {
      await db.business.update({
        where: { id: session.businessId },
        data: businessData,
      });
    }

    if (settingsData) {
      await db.businessSettings.upsert({
        where: { businessId: session.businessId },
        update: settingsData,
        create: {
          businessId: session.businessId,
          ...settingsData,
        },
      });
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "settings:update",
      entity: "Business",
      entityId: session.businessId,
      details: { updated: Object.keys(body) },
    });

    // The public profile shows this. Without dropping its cache the owner
    // edits a price and keeps seeing the old one on their own page.
    revalidateBusinessPage(session.businessSlug);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
