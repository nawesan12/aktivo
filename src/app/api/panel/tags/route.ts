import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:tags");

    const tags = await db.clientTag.findMany({
      where: { businessId: session.businessId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: tags });
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
    requirePermission(session.role, "clients:tags");

    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const tag = await db.clientTag.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        color: color || "#6366F1",
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe un tag con ese nombre" }, { status: 409 });
    }
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
