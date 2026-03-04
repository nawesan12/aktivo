import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.role || session.user.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.plan !== undefined) updateData.plan = body.plan;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const business = await db.business.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, plan: true, isActive: true },
    });

    await logAction({
      userId: session.user.id,
      action: "admin:update_business",
      entity: "business",
      entityId: id,
      details: updateData as Record<string, unknown>,
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Admin business update error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
