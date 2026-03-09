import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, NotFoundError } from "@/lib/api-errors";

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
      ? { userId: id, tag: { businessId: session.businessId } }
      : { guestClientId: id, tag: { businessId: session.businessId } };

    const assignments = await db.clientTagAssignment.findMany({
      where,
      include: { tag: true },
    });

    return NextResponse.json({ data: assignments.map((a) => a.tag) });
  } catch (error) {
    return handleApiError(error);
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
    return handleApiError(error);
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

    // Verify tag belongs to this business
    const tag = await db.clientTag.findFirst({
      where: { id: tagId, businessId: session.businessId },
    });
    if (!tag) throw new NotFoundError("Tag no encontrado");

    const user = await db.user.findUnique({ where: { id } });
    const where = user
      ? { tagId_userId: { tagId, userId: id } }
      : { tagId_guestClientId: { tagId, guestClientId: id } };

    await db.clientTagAssignment.delete({ where });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
