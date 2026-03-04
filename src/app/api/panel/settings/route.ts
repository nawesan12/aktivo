import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "settings:read");

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
        primaryColor: business.primaryColor,
        accentColor: business.accentColor,
      },
      settings: business.settings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "settings:update");

    const body = await request.json();
    const { business: businessData, settings: settingsData } = body;

    if (businessData) {
      // Don't allow slug changes
      const { slug: _slug, id: _id, ...updateData } = businessData;
      await db.business.update({
        where: { id: session.businessId },
        data: updateData,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
