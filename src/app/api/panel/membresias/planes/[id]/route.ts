import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { requirePlan } from "@/lib/subscription/enforcement";
import { handleApiError, ConflictError, NotFoundError } from "@/lib/api-errors";
import { logAction } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  description: z.string().trim().max(400).nullable().optional(),
  price: z.number().positive().max(100_000_000).optional(),
  includedVisits: z.number().int().min(0).max(1000).optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  priorityDays: z.number().int().min(0).max(90).optional(),
  benefits: z.array(z.string().trim().min(1).max(120)).max(12).optional(),
  maxMembers: z.number().int().positive().max(100_000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");
    await requirePlan(session.businessId, "ENTERPRISE");

    const { id } = await params;
    const input = patchSchema.parse(await request.json());

    // Scoped by business in the `where`, not checked afterwards: this is
    // multi-tenant and an id from another shop must not be reachable.
    const updated = await db.membershipPlan.updateMany({
      where: { id, businessId: session.businessId },
      data: input,
    });

    if (updated.count === 0) throw new NotFoundError("Plan no encontrado");

    const plan = await db.membershipPlan.findUniqueOrThrow({ where: { id } });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "membership_plan.update",
      entity: "MembershipPlan",
      entityId: id,
      details: input,
    });

    return NextResponse.json({ ...plan, price: Number(plan.price) });
  } catch (error) {
    return handleApiError(error, "panel:membresias:planes:PATCH");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");

    const { id } = await params;

    // A plan with members is history, not a row to delete: the memberships
    // point at it and their credit ledger is the record of what was sold.
    // Deactivating stops new sign-ups without erasing what happened.
    const members = await db.membership.count({
      where: { planId: id, businessId: session.businessId },
    });

    if (members > 0) {
      throw new ConflictError(
        "Este plan tiene socios. Desactivalo en vez de borrarlo, así no se pierde el historial."
      );
    }

    const deleted = await db.membershipPlan.deleteMany({
      where: { id, businessId: session.businessId },
    });

    if (deleted.count === 0) throw new NotFoundError("Plan no encontrado");

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "membership_plan.delete",
      entity: "MembershipPlan",
      entityId: id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "panel:membresias:planes:DELETE");
  }
}
