import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { requirePlan } from "@/lib/subscription/enforcement";
import { handleApiError, ConflictError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { logAction } from "@/lib/audit";
import { periodEnd } from "@/lib/memberships";
import { normalisePhone, phoneLookupVariants } from "@/lib/phone";

const memberSchema = z
  .object({
    planId: z.string().min(1, "Elegí un plan"),
    /** An existing client of this business… */
    guestClientId: z.string().optional(),
    /** …or someone entered on the spot. */
    name: z.string().trim().min(2, "Escribí el nombre").optional(),
    phone: z.string().trim().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    notes: z.string().trim().max(300).optional(),
  })
  .refine((data) => data.guestClientId || data.name, {
    message: "Elegí un cliente o escribí su nombre",
    path: ["name"],
  });

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "clients:read");

    const status = request.nextUrl.searchParams.get("status") ?? "ACTIVE";

    const memberships = await db.membership.findMany({
      where: {
        businessId: session.businessId,
        ...(status === "ALL" ? {} : { status: status as "ACTIVE" | "EXPIRED" | "CANCELLED" }),
      },
      orderBy: { endDate: "asc" },
      take: 200,
      include: {
        plan: { select: { name: true, includedVisits: true } },
        user: { select: { name: true, email: true, phone: true } },
        guestClient: { select: { name: true, email: true, phone: true } },
      },
    });

    // One grouped query rather than a balance per row: the ledger is the source
    // of truth and this keeps the list to two round trips instead of N+1.
    const balances = await db.membershipCredit.groupBy({
      by: ["membershipId"],
      where: { membershipId: { in: memberships.map((m) => m.id) } },
      _sum: { amount: true },
    });

    const balanceById = new Map(balances.map((b) => [b.membershipId, b._sum.amount ?? 0]));

    return NextResponse.json({
      data: memberships.map((membership) => ({
        id: membership.id,
        planName: membership.plan.name,
        clientName: membership.user?.name ?? membership.guestClient?.name ?? "Sin nombre",
        clientPhone: membership.user?.phone ?? membership.guestClient?.phone ?? null,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: membership.status,
        remaining: balanceById.get(membership.id) ?? 0,
        includedVisits: membership.plan.includedVisits,
        notes: membership.notes,
      })),
    });
  } catch (error) {
    return handleApiError(error, "panel:membresias:socios:GET");
  }
}

/**
 * Signs a client up, and grants the period's visits in the same transaction.
 *
 * The grant is a ledger entry, not a counter: everything that ever happens to a
 * membership's visits is one row here, so "why does this person have two left"
 * always has an answer.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "clients:update");
    await requirePlan(session.businessId, "ENTERPRISE");

    const input = memberSchema.parse(await request.json());

    const plan = await db.membershipPlan.findFirst({
      where: { id: input.planId, businessId: session.businessId, isActive: true },
    });

    if (!plan) throw new NotFoundError("Plan no encontrado");

    if (plan.maxMembers !== null) {
      const active = await db.membership.count({
        where: { planId: plan.id, status: "ACTIVE", endDate: { gt: new Date() } },
      });
      if (active >= plan.maxMembers) {
        throw new ConflictError("Este plan ya llegó a su cupo de socios");
      }
    }

    // The client: an existing one, or found by phone, or created.
    let client = input.guestClientId
      ? await db.guestClient.findFirst({
          where: { id: input.guestClientId, businessId: session.businessId },
        })
      : input.phone
        ? await db.guestClient.findFirst({
            where: {
              businessId: session.businessId,
              phone: { in: phoneLookupVariants(input.phone) },
            },
          })
        : null;

    if (!client) {
      if (!input.name) throw new ValidationError("Escribí el nombre del socio");
      client = await db.guestClient.create({
        data: {
          businessId: session.businessId,
          name: input.name,
          phone: input.phone ? normalisePhone(input.phone) : "",
          email: input.email || null,
        },
      });
    }

    const alreadyMember = await db.membership.findFirst({
      where: {
        businessId: session.businessId,
        guestClientId: client.id,
        status: "ACTIVE",
        endDate: { gt: new Date() },
      },
    });

    if (alreadyMember) {
      throw new ConflictError("Esa persona ya tiene una membresía activa");
    }

    const membership = await db.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          businessId: session.businessId,
          planId: plan.id,
          guestClientId: client.id,
          endDate: periodEnd(plan.durationDays),
          notes: input.notes || null,
        },
      });

      if (plan.includedVisits > 0) {
        await tx.membershipCredit.create({
          data: {
            businessId: session.businessId,
            membershipId: created.id,
            amount: plan.includedVisits,
            reason: `Alta en ${plan.name}`,
            createdById: session.userId,
          },
        });
      }

      return created;
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "membership.create",
      entity: "Membership",
      entityId: membership.id,
      details: { plan: plan.name, client: client.name },
    });

    return NextResponse.json(
      { id: membership.id, clientName: client.name, planName: plan.name },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "panel:membresias:socios:POST");
  }
}
