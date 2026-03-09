import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { getPlanForBusiness } from "@/lib/subscription/enforcement";
import { PLAN_LIMITS, PLAN_PRICES } from "@/lib/subscription/config";
import { getPlatformPreApproval, getMPPlanId } from "@/lib/subscription/mp-platform";
import { startOfMonth, endOfMonth } from "date-fns";
import type { BusinessPlan } from "@/generated/prisma/client";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "billing:read");

    const effectivePlan = await getPlanForBusiness(session.businessId);
    const limits = PLAN_LIMITS[effectivePlan];

    // Get usage stats
    const now = new Date();
    const [staffCount, appointmentCount, subscription] = await Promise.all([
      db.staffMember.count({
        where: { businessId: session.businessId, isActive: true },
      }),
      db.appointment.count({
        where: {
          businessId: session.businessId,
          createdAt: { gte: startOfMonth(now), lte: endOfMonth(now) },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      db.subscription.findFirst({
        where: {
          businessId: session.businessId,
          status: { in: ["AUTHORIZED", "PAUSED", "PENDING"] },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      plan: effectivePlan,
      limits,
      usage: {
        staff: staffCount,
        staffLimit: limits.maxStaff,
        appointments: appointmentCount,
        appointmentsLimit: limits.maxAppointmentsPerMonth,
      },
      features: {
        mpPayments: limits.mpPayments,
        crm: limits.crm,
        campaigns: limits.campaigns,
        widget: limits.widget,
        advancedReports: limits.advancedReports,
        multiLocation: limits.multiLocation,
        whiteLabel: limits.whiteLabel,
      },
      subscription: subscription
        ? {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            nextPaymentDate: subscription.nextPaymentDate,
            lastPaymentDate: subscription.lastPaymentDate,
            gracePeriodEnd: subscription.gracePeriodEnd,
            cancelledAt: subscription.cancelledAt,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "billing:manage");

    const body = await request.json();
    const plan = body.plan as BusinessPlan;

    if (plan !== "PROFESSIONAL" && plan !== "ENTERPRISE") {
      throw new ValidationError("Plan inválido. Elegí PROFESSIONAL o ENTERPRISE.");
    }

    // Check for existing active subscription
    const existing = await db.subscription.findFirst({
      where: {
        businessId: session.businessId,
        status: { in: ["AUTHORIZED", "PENDING"] },
      },
    });

    if (existing) {
      throw new ValidationError("Ya tenés una suscripción activa. Cancelala primero para cambiar de plan.");
    }

    const price = PLAN_PRICES[plan];
    const externalReference = `sub_${session.businessId}_${Date.now()}`;

    // Create local subscription record
    const subscription = await db.subscription.create({
      data: {
        businessId: session.businessId,
        plan,
        status: "PENDING",
        amount: price.amount,
        currency: price.currency,
        externalReference,
      },
    });

    // Create MP preapproval (subscription)
    const preApproval = getPlatformPreApproval();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jiku.app";

    const mpResult = await preApproval.create({
      body: {
        preapproval_plan_id: getMPPlanId(plan),
        external_reference: externalReference,
        payer_email: body.email || undefined,
        back_url: `${appUrl}/panel/suscripcion?result=callback`,
        reason: `Jiku ${plan === "PROFESSIONAL" ? "Pro" : "Business"} - Suscripción mensual`,
      },
    });

    // Update subscription with MP data
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        mpPreapprovalId: mpResult.id,
        mpInitPoint: mpResult.init_point,
        payerEmail: body.email || null,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      initPoint: mpResult.init_point,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
