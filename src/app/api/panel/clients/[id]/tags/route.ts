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
    requirePermission(session.role, "clients:tags");
    const { id } = await params;

    // Determine if this is a user or guest client
    const user = await db.user.findUnique({ where: { id } });
    const where = user
      ? { userId: id }
      : { guestClientId: id };

    const assignments = await db.clientTagAssignment.findMany({
      where,
      include: { tag: true },
    });

    return NextResponse.json({ data: assignments.map((a) => a.tag) });
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
    requirePermission(session.role, "clients:tags");
    const { id } = await params;

    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ error: "tagId requerido" }, { status: 400 });
    }

    // Verify tag belongs to this business
    const tag = await db.clientTag.findFirst({
      where: { id: tagId, businessId: session.businessId },
    });
    if (!tag) {
      return NextResponse.json({ error: "Tag no encontrado" }, { status: 404 });
    }

    // Determine client type
    const user = await db.user.findUnique({ where: { id } });
    const data = user
      ? { tagId, userId: id }
      : { tagId, guestClientId: id };

    const assignment = await db.clientTagAssignment.create({ data });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Tag ya asignado" }, { status: 409 });
    }
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:tags");
    const { id } = await params;

    const { searchParams } = request.nextUrl;
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "tagId requerido" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id } });
    const where = user
      ? { tagId_userId: { tagId, userId: id } }
      : { tagId_guestClientId: { tagId, guestClientId: id } };

    await db.clientTagAssignment.delete({ where });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403
      : message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
