import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { staffSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "staff:read");

    const staff = await db.staffMember.findMany({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "asc" },
      include: {
        services: { select: { service: { select: { id: true, name: true } } } },
        workingHours: { orderBy: { dayOfWeek: "asc" } },
        _count: { select: { appointments: true } },
      },
    });

    // Flatten services for frontend
    const flat = staff.map((s) => ({
      ...s,
      services: s.services.map((ss) => ss.service),
    }));

    return NextResponse.json({ data: flat });
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
    requirePermission(session.role, "staff:create");

    const body = await request.json();
    const parsed = staffSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, email, phone, bio, specialty } = parsed.data;

    const maxOrder = await db.staffMember.findFirst({
      where: { businessId: session.businessId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const staff = await db.staffMember.create({
      data: {
        businessId: session.businessId,
        name,
        email: email || null,
        phone: phone || null,
        bio: bio || null,
        specialty: specialty || null,
        sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
        isActive: true,
      },
    });

    // Connect services if provided
    if (body.serviceIds?.length) {
      await db.staffService.createMany({
        data: body.serviceIds.map((serviceId: string) => ({
          staffId: staff.id,
          serviceId,
        })),
        skipDuplicates: true,
      });
    }

    // Create default working hours (Mon-Fri 9-18)
    const defaultHours = Array.from({ length: 5 }, (_, i) => ({
      staffId: staff.id,
      dayOfWeek: i + 1,
      startTime: "09:00",
      endTime: "18:00",
      isActive: true,
    }));

    await db.workingHours.createMany({ data: defaultHours });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "staff:create",
      entity: "StaffMember",
      entityId: staff.id,
      details: { name, specialty },
    });

    return NextResponse.json(staff, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
