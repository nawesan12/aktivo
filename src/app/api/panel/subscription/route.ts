import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { getPlanForBusiness } from "@/lib/subscription/enforcement";
import { PLAN_LIMITS, PLAN_PRICES, PLAN_NAMES } from "@/lib/subscription/config";
import { getBusinessAccess } from "@/lib/subscription/access";
import { getPlatformPreApproval, getMPPlanId } from "@/lib/subscription/mp-platform";
import { startOfMonth, endOfMonth } from "date-fns";
import type { BusinessPlan } from "@/generated/prisma/client";
import { createLogger } from "@/lib/logger";
import { appUrl } from "@/lib/env";

const log = createLogger("panel:subscription");

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "billing:read");

    const effectivePlan = await getPlanForBusiness(session.businessId);
    const limits = PLAN_LIMITS[effectivePlan];
    const access = await getBusinessAccess(session.businessId);

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
      planName: PLAN_NAMES[effectivePlan],
      limits,
      // Sent so the interface never hardcodes a price of its own: it used to
      // carry its own copy, and the two drifted apart.
      catalog: (["PROFESSIONAL", "ENTERPRISE"] as const).map((key) => ({
        key,
        name: PLAN_NAMES[key],
        price: PLAN_PRICES[key].amount,
        currency: PLAN_PRICES[key].currency,
        limits: PLAN_LIMITS[key],
      })),
      trial: {
        endsAt: access.trialEndsAt,
        daysLeft: access.trialDaysLeft,
      },
      blocked: access.blocked,
      usage: {
        staff: staffCount,
        staffLimit: limits.maxStaff,
        appointments: appointmentCount,
        appointmentsLimit: limits.maxAppointmentsPerMonth,
      },
      features: {
        mpPayments: limits.mpPayments,
        crm: limits.crm,
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
    await requireBusinessPermission(session, "billing:manage");

    const body = await request.json();
    const plan = body.plan as BusinessPlan;

    if (plan !== "PROFESSIONAL" && plan !== "ENTERPRISE") {
      throw new ValidationError("Plan inválido. Elegí PROFESSIONAL o ENTERPRISE.");
    }

    // Only an authorised subscription is a subscription. A PENDING row is a
    // checkout that was started and not finished — closing the tab on
    // MercadoPago's screen is enough to leave one behind — and treating it as
    // active locked the business out of ever subscribing: this route refused
    // because of it, and `/cancel` would not touch it because it only knows how
    // to cancel an authorised one. One abandoned attempt and there was no way
    // back in from the product.
    const active = await db.subscription.findFirst({
      where: {
        businessId: session.businessId,
        status: "AUTHORIZED",
      },
    });

    if (active) {
      throw new ValidationError("Ya tenés una suscripción activa. Cancelala primero para cambiar de plan.");
    }

    // Whatever was left half-way is closed here rather than piling up: the row
    // stays, so the history still tells what happened, but it no longer stands
    // between the person and the plan they are trying to buy.
    const abandoned = await db.subscription.updateMany({
      where: { businessId: session.businessId, status: "PENDING" },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "Checkout abandonado",
      },
    });

    if (abandoned.count > 0) {
      log.info("discarded abandoned checkouts", {
        businessId: session.businessId,
        count: abandoned.count,
      });
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
    const baseUrl = appUrl();

    const mpResult = await preApproval.create({
      body: {
        preapproval_plan_id: getMPPlanId(plan),
        external_reference: externalReference,
        payer_email: body.email || undefined,
        back_url: `${baseUrl}/panel/suscripcion?result=callback`,
        // What the customer reads on their MercadoPago statement. It said
        // "Jiku Pro" and "Jiku Business", names that appear nowhere in the
        // product — the plans are Inicial and Completo.
        reason: `Jiku ${PLAN_NAMES[plan]} — Suscripción mensual`,
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
