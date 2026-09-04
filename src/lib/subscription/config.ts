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
  /** Selling "cuatro cortes al mes" instead of charging per visit. */
  memberships: boolean;
}

export const PLAN_LIMITS: Record<BusinessPlan, PlanLimits> = {
  STARTER: {
    maxStaff: 1,
    maxAppointmentsPerMonth: 50,
    memberships: false,
    mpPayments: false,
    crm: false,
    campaigns: false,
    widget: false,
    advancedReports: false,
    multiLocation: false,
    whiteLabel: false,
  },
  /**
   * The entry plan, deliberately sized for a shop that is starting out.
   *
   * It used to be three professionals and unlimited turnos, which is most of a
   * busy barbershop — so nothing above it had a reason to exist. Two chairs and
   * a real ceiling is the shape of a plan somebody grows out of, which is the
   * point of an entry plan.
   */
  PROFESSIONAL: {
    maxStaff: 2,
    // About five turnos a day per chair. A shop working steadily passes it,
    // and passing it is exactly when the next plan starts paying for itself.
    maxAppointmentsPerMonth: 300,
    mpPayments: true,
    crm: true,
    campaigns: false,
    widget: true,
    advancedReports: false,
    multiLocation: false,
    whiteLabel: false,
    memberships: false,
  },
  /**
   * The plan a shop moves to because it makes them money, not because they ran
   * out of seats: memberships turn a good month into a predictable one, and
   * campaigns bring people back. Those are the reasons to pay more; a head
   * count is a tax, not a benefit.
   */
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
    memberships: true,
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
