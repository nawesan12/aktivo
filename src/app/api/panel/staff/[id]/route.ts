import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { staffSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "staff:update");

    const { id } = await params;
    const body = await request.json();
    const parsed = staffSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.staffMember.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = { ...parsed.data };

    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const staff = await db.staffMember.update({
      where: { id },
      data: updateData,
      include: {
        services: { select: { service: { select: { id: true, name: true } } } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
      },
    });

    // Update service assignments if provided
    if (body.serviceIds) {
      await db.staffService.deleteMany({ where: { staffId: id } });
      if (body.serviceIds.length > 0) {
        await db.staffService.createMany({
          data: body.serviceIds.map((serviceId: string) => ({ staffId: id, serviceId })),
          skipDuplicates: true,
        });
      }
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "staff:update",
      entity: "StaffMember",
      entityId: id,
      details: parsed.data,
    });

    return NextResponse.json(staff);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
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
    requirePermission(session.role, "staff:delete");

    const { id } = await params;
    const existing = await db.staffMember.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        _count: {
          select: {
            appointments: {
              where: {
                status: { in: ["PENDING", "CONFIRMED"] },
                dateTime: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    if (existing._count.appointments > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${existing._count.appointments} turno(s) pendiente(s)` },
        { status: 409 }
      );
    }

    await db.staffMember.delete({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "staff:delete",
      entity: "StaffMember",
      entityId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
