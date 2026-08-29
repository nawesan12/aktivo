// Pure pricing rules: no database access. Unit-tested in __tests__/pricing.test.ts.

export interface CouponLike {
  /** "PERCENTAGE" | "FIXED" */
  type: string;
  value: number;
}

/**
 * Discount in pesos that a coupon applies to a price.
 *
 * Always clamped to [0, price]: a percentage above 100 or a fixed amount larger
 * than the service can never produce a negative total or a refund.
 */
export function calculateCouponDiscount(price: number, coupon: CouponLike): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(coupon.value) || coupon.value <= 0) return 0;

  const raw =
    coupon.type === "PERCENTAGE"
      ? Math.round((price * coupon.value) / 100)
      : coupon.value;

  return Math.max(0, Math.min(raw, price));
}

/** Price left to charge after a discount, never below zero. */
export function applyDiscount(price: number, discount: number): number {
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (!Number.isFinite(discount) || discount <= 0) return price;
  return Math.max(0, price - discount);
}

/**
 * How much to charge up front for a service, given the business's payment mode.
 * Callers must pass the price *after* any discount.
 */
export function calculatePaymentAmount(
  servicePrice: number,
  mode: "FULL" | "PERCENTAGE" | "FIXED",
  depositPercentage?: number | null,
  depositFixedAmount?: number | null
): number {
  switch (mode) {
    case "FULL":
      return servicePrice;
    case "PERCENTAGE":
      return Math.round(servicePrice * ((depositPercentage || 50) / 100));
    case "FIXED":
      return Math.min(depositFixedAmount || 0, servicePrice);
    default:
      return servicePrice;
  }
}
