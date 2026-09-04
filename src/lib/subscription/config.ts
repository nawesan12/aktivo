import type { BusinessPlan } from "@/generated/prisma/client";

export interface PlanLimits {
  maxStaff: number | null; // null = unlimited
  maxAppointmentsPerMonth: number | null;
  mpPayments: boolean;
  crm: boolean;
  campaigns: boolean;
  widget: boolean;
  advancedReports: boolean;
  multiLocation: boolean;
  whiteLabel: boolean;
}

export const PLAN_LIMITS: Record<BusinessPlan, PlanLimits> = {
  STARTER: {
    maxStaff: 1,
    maxAppointmentsPerMonth: 50,
    mpPayments: false,
    crm: false,
    campaigns: false,
    widget: false,
    advancedReports: false,
    multiLocation: false,
    whiteLabel: false,
  },
  PROFESSIONAL: {
    maxStaff: 3,
    maxAppointmentsPerMonth: null,
    mpPayments: true,
    crm: true,
    campaigns: true,
    widget: true,
    advancedReports: true,
    multiLocation: false,
    whiteLabel: false,
  },
  ENTERPRISE: {
    maxStaff: null,
    maxAppointmentsPerMonth: null,
    mpPayments: true,
    crm: true,
    campaigns: true,
    widget: true,
    advancedReports: true,
    multiLocation: true,
    whiteLabel: true,
  },
};

/**
 * The price the interface shows. MercadoPago holds the real one inside each
 * preapproval plan, so changing a number here without creating new plans there
 * makes the app advertise one figure and charge another.
 */
export const PLAN_PRICES: Record<string, { amount: number; currency: string }> = {
  PROFESSIONAL: { amount: 7000, currency: "ARS" },
  ENTERPRISE: { amount: 15000, currency: "ARS" },
};

/** What each plan is called in front of a customer. */
export const PLAN_NAMES: Record<BusinessPlan, string> = {
  STARTER: "Sin plan",
  PROFESSIONAL: "Inicial",
  ENTERPRISE: "Completo",
};

export const GRACE_PERIOD_DAYS = 7;

/**
 * What Jiku keeps from each deposit collected through a linked MercadoPago
 * account, on top of the subscription.
 *
 * The money goes straight to the business; MercadoPago withholds this share and
 * settles it to the platform. It is said out loud on the screen where the owner
 * links the account — they are going to see it in their own MercadoPago
 * statement, and it is better that they read it here first.
 */
export const PLATFORM_COMMISSION_RATE = 0.01;

/** The platform's cut of an amount, rounded to the cent. */
export function platformCommission(amount: number): number {
  return Math.round(amount * PLATFORM_COMMISSION_RATE * 100) / 100;
}

const PLAN_ORDER: BusinessPlan[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

export function planRank(plan: BusinessPlan): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isAtLeast(current: BusinessPlan, minimum: BusinessPlan): boolean {
  return planRank(current) >= planRank(minimum);
}
