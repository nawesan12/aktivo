import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, NotFoundError, ValidationError } from "@/lib/api-errors";
import { logAction } from "@/lib/audit";
import { membershipBalance, periodEnd } from "@/lib/memberships";

const patchSchema = z.object({
  /** Visits to add (positive) or take away (negative). */
  adjustVisits: z.number().int().min(-100).max(100).optional(),
  reason: z.string().trim().max(120).optional(),
  /** Starts a new period from today, granting the plan's visits again. */
  renew: z.boolean().optional(),
  status: z.enum(["ACTIVE", "CANCELLED"]).optional(),
});

/** The membership with its full ledger: every visit granted, spent or refunded. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "clients:read");

    const { id } = await params;

    const membership = await db.membership.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        plan: true,
        user: { select: { name: true, email: true, phone: true } },
        guestClient: { select: { name: true, email: true, phone: true } },
        credits: { orderBy: { createdAt: "desc" }, take: 100 },
      },
    });

    if (!membership) throw new NotFoundError("Membresía no encontrada");

    return NextResponse.json({
      id: membership.id,
      planName: membership.plan.name,
      includedVisits: membership.plan.includedVisits,
      clientName: membership.user?.name ?? membership.guestClient?.name ?? "Sin nombre",
      startDate: membership.startDate,
      endDate: membership.endDate,
      status: membership.status,
      remaining: await membershipBalance(membership.id),
      credits: membership.credits,
    });
  } catch (error) {
    return handleApiError(error, "panel:membresias:socios:GET-one");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "clients:update");

    const { id } = await params;
    const input = patchSchema.parse(await request.json());

    const membership = await db.membership.findFirst({
      where: { id, businessId: session.businessId },
      include: { plan: true },
    });

    if (!membership) throw new NotFoundError("Membresía no encontrada");

    if (input.adjustVisits) {
      const balance = await membershipBalance(id);
      // Refusing to go below zero keeps "remaining" a number that means
      // something: a negative balance is not a debt anybody can collect.
      if (balance + input.adjustVisits < 0) {
        throw new ValidationError(`Sólo le quedan ${balance} turnos, no se pueden restar más`);
      }

      await db.membershipCredit.create({
        data: {
          businessId: session.businessId,
          membershipId: id,
          amount: input.adjustVisits,
          reason: input.reason || "Ajuste manual",
          createdById: session.userId,
        },
      });
    }

    if (input.renew) {
      await db.$transaction(async (tx) => {
        await tx.membership.update({
          where: { id },
          data: {
            startDate: new Date(),
            endDate: periodEnd(membership.plan.durationDays),
            status: "ACTIVE",
          },
        });

        if (membership.plan.includedVisits > 0) {
          await tx.membershipCredit.create({
            data: {
              businessId: session.businessId,
              membershipId: id,
              amount: membership.plan.includedVisits,
              reason: "Renovación del período",
              createdById: session.userId,
            },
          });
        }
      });
    }

    if (input.status) {
      await db.membership.update({ where: { id }, data: { status: input.status } });
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "membership.update",
      entity: "Membership",
      entityId: id,
      details: input,
    });

    return NextResponse.json({ remaining: await membershipBalance(id) });
  } catch (error) {
    return handleApiError(error, "panel:membresias:socios:PATCH");
  }
}
