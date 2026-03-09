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
  FREE: {
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
    maxStaff: 5,
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

export const PLAN_PRICES: Record<string, { amount: number; currency: string }> = {
  PROFESSIONAL: { amount: 4990, currency: "ARS" },
  ENTERPRISE: { amount: 9990, currency: "ARS" },
};

export const GRACE_PERIOD_DAYS = 7;

const PLAN_ORDER: BusinessPlan[] = ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"];

export function planRank(plan: BusinessPlan): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isAtLeast(current: BusinessPlan, minimum: BusinessPlan): boolean {
  return planRank(current) >= planRank(minimum);
}
