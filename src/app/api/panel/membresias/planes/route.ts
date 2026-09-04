import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { requirePlan } from "@/lib/subscription/enforcement";
import { handleApiError } from "@/lib/api-errors";
import { logAction } from "@/lib/audit";

/**
 * The abonos a business sells.
 *
 * Behind ENTERPRISE on purpose: this is the feature that turns a good month
 * into a predictable one, and it is the reason a shop that already works full
 * moves off the entry plan.
 */
const planSchema = z.object({
  name: z.string().trim().min(2, "Poné un nombre").max(60),
  description: z.string().trim().max(400).optional().nullable(),
  price: z.number().positive("El precio tiene que ser mayor a cero").max(100_000_000),
  includedVisits: z.number().int().min(0).max(1000),
  durationDays: z.number().int().min(1, "Mínimo un día").max(365),
  priorityDays: z.number().int().min(0).max(90),
  benefits: z.array(z.string().trim().min(1).max(120)).max(12).default([]),
  maxMembers: z.number().int().positive().max(100_000).nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:read");

    const plans = await db.membershipPlan.findMany({
      where: { businessId: session.businessId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { memberships: { where: { status: "ACTIVE" } } } },
      },
    });

    return NextResponse.json({
      data: plans.map((plan) => ({ ...plan, price: Number(plan.price) })),
    });
  } catch (error) {
    return handleApiError(error, "panel:membresias:planes:GET");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "settings:update");
    await requirePlan(session.businessId, "ENTERPRISE");

    const input = planSchema.parse(await request.json());

    const plan = await db.membershipPlan.create({
      data: { businessId: session.businessId, ...input },
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "membership_plan.create",
      entity: "MembershipPlan",
      entityId: plan.id,
      details: { name: plan.name, price: Number(plan.price) },
    });

    return NextResponse.json({ ...plan, price: Number(plan.price) }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "panel:membresias:planes:POST");
  }
}
