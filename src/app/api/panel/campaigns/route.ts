import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { campaignSchema } from "@/lib/validations";
import { requirePlan } from "@/lib/subscription/enforcement";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:read");

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { businessId: session.businessId };
    if (status) where.status = status;

    const campaigns = await db.campaign.findMany({
      where,
      include: { _count: { select: { executions: true } } },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: campaigns });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:manage");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const body = await request.json();
    const parsed = campaignSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Datos inválidos");
    }
    const { name, type, messageSubject, messageBody, triggerConfig, targetTagIds, channel } = parsed.data;

    const campaign = await db.campaign.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        type,
        messageSubject: messageSubject?.trim() || null,
        messageBody: messageBody.trim(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        triggerConfig: (triggerConfig ?? undefined) as any,
        targetTagIds: targetTagIds || [],
        channel: channel || "EMAIL",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
