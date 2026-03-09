import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { tagSchema } from "@/lib/validations";

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
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "clients:tags");

    const body = await request.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Datos inválidos");
    }

    const tag = await db.clientTag.create({
      data: {
        businessId: session.businessId,
        name: parsed.data.name.trim(),
        color: parsed.data.color,
      },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
