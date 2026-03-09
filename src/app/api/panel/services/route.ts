import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { serviceSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:read");

    const services = await db.service.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      include: {
        category: { select: { id: true, name: true } },
        staff: { select: { staff: { select: { id: true, name: true } } } },
      },
    });

    // Flatten staff for frontend
    const flat = services.map((s) => ({
      ...s,
      staff: s.staff.map((ss) => ss.staff),
    }));

    return NextResponse.json({ data: flat });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "services:create");

    const body = await request.json();
    const parsed = serviceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { name, description, duration, price, categoryId, isActive } = parsed.data;

    const service = await db.service.create({
      data: {
        businessId: session.businessId,
        name,
        description,
        duration,
        price,
        categoryId: categoryId || null,
        isActive,
      },
      include: {
        category: { select: { id: true, name: true } },
        staff: { select: { staff: { select: { id: true, name: true } } } },
      },
    });

    // Connect staff if provided
    if (body.staffIds?.length) {
      await db.staffService.createMany({
        data: body.staffIds.map((staffId: string) => ({
          staffId,
          serviceId: service.id,
        })),
        skipDuplicates: true,
      });
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "service:create",
      entity: "Service",
      entityId: service.id,
      details: { name, price, duration },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
