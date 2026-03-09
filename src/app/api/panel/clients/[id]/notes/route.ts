import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { noteSchema } from "@/lib/validations";

async function verifyClientBelongsToBusiness(clientId: string, businessId: string) {
  // Check if registered user has appointments with this business
  const user = await db.user.findUnique({ where: { id: clientId } });
  if (user) {
    const hasRelation = await db.appointment.findFirst({
      where: { userId: clientId, businessId },
      select: { id: true },
    });
    if (!hasRelation) throw new NotFoundError("Cliente no encontrado");
    return "user" as const;
  }
  // Check if guest client belongs to this business
  const guest = await db.guestClient.findFirst({
    where: { id: clientId, businessId },
    select: { id: true },
  });
  if (!guest) throw new NotFoundError("Cliente no encontrado");
  return "guest" as const;
}

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
    return handleApiError(error);
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
    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Datos inválidos");
    }

    const clientType = await verifyClientBelongsToBusiness(id, session.businessId);
    const content = parsed.data.content.trim();
    const data = clientType === "user"
      ? { businessId: session.businessId, authorId: session.userId, userId: id, content }
      : { businessId: session.businessId, authorId: session.userId, guestClientId: id, content };

    const note = await db.clientNote.create({
      data,
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
