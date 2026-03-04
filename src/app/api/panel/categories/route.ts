import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:read");

    const categories = await db.serviceCategory.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { services: true } } },
    });

    return NextResponse.json({ data: categories });
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
    requirePermission(session.role, "services:create");

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Nombre invalido (minimo 2 caracteres)" }, { status: 400 });
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

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
