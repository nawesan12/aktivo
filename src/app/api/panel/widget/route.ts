import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "widget:manage");

    const settings = await db.businessSettings.findUnique({
      where: { businessId: session.businessId },
      select: {
        widgetEnabled: true,
        widgetTheme: true,
        widgetPosition: true,
      },
    });

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { slug: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jiku.app";
    const embedCode = `<script src="${baseUrl}/widget/jiku-widget.js" data-business="${business?.slug}" data-theme="${settings?.widgetTheme || "dark"}" data-position="${settings?.widgetPosition || "bottom-right"}"></script>`;

    return NextResponse.json({
      settings,
      embedCode,
      previewUrl: `${baseUrl}/embed/${business?.slug}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "widget:manage");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const body = await request.json();
    const { widgetEnabled, widgetTheme, widgetPosition } = body;

    const settings = await db.businessSettings.update({
      where: { businessId: session.businessId },
      data: {
        ...(widgetEnabled !== undefined && { widgetEnabled }),
        ...(widgetTheme && { widgetTheme }),
        ...(widgetPosition && { widgetPosition }),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
