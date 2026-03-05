import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public CORS-enabled endpoint for widget configuration.
 * No auth required — returns only public-safe data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;

    const business = await db.business.findFirst({
      where: {
        OR: [{ id: businessId }, { slug: businessId }],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        accentColor: true,
        settings: {
          select: {
            widgetEnabled: true,
            widgetTheme: true,
            widgetPosition: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    if (!business.settings?.widgetEnabled) {
      return NextResponse.json({ error: "Widget no habilitado" }, { status: 403 });
    }

    const response = NextResponse.json({
      id: business.id,
      name: business.name,
      slug: business.slug,
      logo: business.logo,
      primaryColor: business.primaryColor,
      accentColor: business.accentColor,
      theme: business.settings.widgetTheme,
      position: business.settings.widgetPosition,
    });

    // CORS headers
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  return response;
}
