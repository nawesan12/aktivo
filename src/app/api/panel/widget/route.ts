import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { appUrl } from "@/lib/env";
import { revalidateBusinessPage } from "@/lib/booking/business-page";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "widget:manage");

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

    const baseUrl = appUrl();
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
    await requireBusinessPermission(session, "widget:manage");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const body = await request.json();
    const { widgetEnabled, widgetTheme, widgetPosition } = body;

    // upsert, not update: a business without a settings row got "Record to
    // update not found" turned into a generic 500. The screen loaded fine —
    // the GET tolerates null — and only failed on save.
    const settings = await db.businessSettings.upsert({
      where: { businessId: session.businessId },
      create: {
        businessId: session.businessId,
        ...(widgetEnabled !== undefined && { widgetEnabled }),
        ...(widgetTheme !== undefined && { widgetTheme }),
        ...(widgetPosition !== undefined && { widgetPosition }),
      },
      update: {
        ...(widgetEnabled !== undefined && { widgetEnabled }),
        ...(widgetTheme && { widgetTheme }),
        ...(widgetPosition && { widgetPosition }),
      },
    });

    // Turning the widget on has to take effect now, not when the cached 404
    // of the embed page expires.
    revalidateBusinessPage(session.businessSlug);

    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
