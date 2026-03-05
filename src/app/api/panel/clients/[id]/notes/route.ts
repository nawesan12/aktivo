import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:read");
    const { id } = await params;

    const user = await db.user.findUnique({ where: { id } });
    const where = user
      ? { businessId: session.businessId, userId: id }
      : { businessId: session.businessId, guestClientId: id };

    const notes = await db.clientNote.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: notes });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:update");
    const { id } = await params;

    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenido requerido" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    const data = user
      ? { businessId: session.businessId, authorId: session.userId, userId: id, content: content.trim() }
      : { businessId: session.businessId, authorId: session.userId, guestClientId: id, content: content.trim() };

    const note = await db.clientNote.create({
      data,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
