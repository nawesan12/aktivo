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

const PLAN_ORDER: BusinessPlan[] = ["STARTER", "PROFESSIONAL", "ENTERPRISE"];

export function planRank(plan: BusinessPlan): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isAtLeast(current: BusinessPlan, minimum: BusinessPlan): boolean {
  return planRank(current) >= planRank(minimum);
}
