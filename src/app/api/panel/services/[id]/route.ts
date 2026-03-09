import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { serviceSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:update");

    const { id } = await params;
    const body = await request.json();
    const parsed = serviceSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.service.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    const service = await db.service.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        staff: { select: { staff: { select: { id: true, name: true } } } },
      },
    });

    // Update staff assignments if provided
    if (body.staffIds) {
      await db.staffService.deleteMany({ where: { serviceId: id } });
      if (body.staffIds.length > 0) {
        await db.staffService.createMany({
          data: body.staffIds.map((staffId: string) => ({ staffId, serviceId: id })),
          skipDuplicates: true,
        });
      }
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "service:update",
      entity: "Service",
      entityId: id,
      details: parsed.data,
    });

    return NextResponse.json(service);
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
    requirePermission(session.role, "services:delete");

    const { id } = await params;
    const existing = await db.service.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    await db.service.delete({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "service:delete",
      entity: "Service",
      entityId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
