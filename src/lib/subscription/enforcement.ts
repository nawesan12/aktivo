import { db } from "@/lib/db";
import type { BusinessPlan } from "@/generated/prisma/client";
import { PlanLimitError } from "@/lib/api-errors";
import { PLAN_LIMITS, isAtLeast } from "./config";
import { startOfMonth, endOfMonth } from "date-fns";

/**
 * Returns the effective plan for a business, lazily checking grace period expiry.
 * If subscription is PAUSED and grace period passed, downgrades to FREE.
 */
export async function getPlanForBusiness(businessId: string): Promise<BusinessPlan> {
  const business = await db.business.findUniqueOrThrow({
    where: { id: businessId },
    select: { plan: true },
  });

  // If already FREE/STARTER, no subscription check needed
  if (business.plan === "FREE" || business.plan === "STARTER") {
    return business.plan;
  }

  // Check active subscription
  const subscription = await db.subscription.findFirst({
    where: {
      businessId,
      plan: business.plan,
      status: { in: ["AUTHORIZED", "PAUSED"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!subscription) {
    // No active subscription for a paid plan — downgrade
    await db.business.update({
      where: { id: businessId },
      data: { plan: "FREE" },
    });
    return "FREE";
  }

  // If PAUSED, check grace period
  if (subscription.status === "PAUSED" && subscription.gracePeriodEnd) {
    if (new Date() > subscription.gracePeriodEnd) {
      // Grace period expired — downgrade
      await db.$transaction([
        db.subscription.update({
          where: { id: subscription.id },
          data: { status: "EXPIRED" },
        }),
        db.business.update({
          where: { id: businessId },
          data: { plan: "FREE" },
        }),
      ]);
      return "FREE";
    }
  }

  return business.plan;
}

/**
 * Throws PlanLimitError if business plan is below the minimum required.
 */
export async function requirePlan(
  businessId: string,
  minimumPlan: BusinessPlan
): Promise<void> {
  const currentPlan = await getPlanForBusiness(businessId);
  if (!isAtLeast(currentPlan, minimumPlan)) {
    throw new PlanLimitError(
      `Esta funcionalidad requiere el plan ${minimumPlan}`,
      minimumPlan
    );
  }
}

/**
 * Checks if adding one more staff member would exceed the plan limit.
 */
export async function checkStaffLimit(businessId: string): Promise<void> {
  const plan = await getPlanForBusiness(businessId);
  const limits = PLAN_LIMITS[plan];

  if (limits.maxStaff === null) return; // unlimited

  const currentCount = await db.staffMember.count({
    where: { businessId, isActive: true },
  });

  if (currentCount >= limits.maxStaff) {
    throw new PlanLimitError(
      `Tu plan permite hasta ${limits.maxStaff} profesional(es). Mejorá tu plan para agregar más.`,
      plan === "STARTER" || plan === "FREE" ? "PROFESSIONAL" : "ENTERPRISE"
    );
  }
}

/**
 * Checks if the business has reached its monthly appointment limit.
 */
export async function checkAppointmentLimit(businessId: string): Promise<void> {
  const plan = await getPlanForBusiness(businessId);
  const limits = PLAN_LIMITS[plan];

  if (limits.maxAppointmentsPerMonth === null) return; // unlimited

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentCount = await db.appointment.count({
    where: {
      businessId,
      createdAt: { gte: monthStart, lte: monthEnd },
      status: { notIn: ["CANCELLED"] },
    },
  });

  if (currentCount >= limits.maxAppointmentsPerMonth) {
    throw new PlanLimitError(
      `Tu plan permite hasta ${limits.maxAppointmentsPerMonth} turnos/mes. Mejorá tu plan para turnos ilimitados.`,
      "PROFESSIONAL"
    );
  }
}
