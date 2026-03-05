import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

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
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:manage");

    const body = await request.json();
    const { name, type, messageSubject, messageBody, triggerConfig, targetTagIds, channel } = body;

    if (!name?.trim() || !type || !messageBody?.trim()) {
      return NextResponse.json({ error: "Nombre, tipo y mensaje son requeridos" }, { status: 400 });
    }

    const campaign = await db.campaign.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        type,
        messageSubject: messageSubject?.trim() || null,
        messageBody: messageBody.trim(),
        triggerConfig: triggerConfig || null,
        targetTagIds: targetTagIds || [],
        channel: channel || "EMAIL",
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
