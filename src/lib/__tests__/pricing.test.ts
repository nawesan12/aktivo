import { describe, it, expect } from "vitest";
import { calculateCouponDiscount, applyDiscount, calculatePaymentAmount } from "../pricing";

describe("calculateCouponDiscount", () => {
  it("calcula un porcentaje sobre el precio", () => {
    expect(calculateCouponDiscount(5000, { type: "PERCENTAGE", value: 20 })).toBe(1000);
  });

  it("redondea el porcentaje al peso más cercano", () => {
    expect(calculateCouponDiscount(4990, { type: "PERCENTAGE", value: 15 })).toBe(749);
  });

  it("toma el valor literal en un cupón de monto fijo", () => {
    expect(calculateCouponDiscount(5000, { type: "FIXED", value: 1500 })).toBe(1500);
  });

  it("nunca descuenta más que el precio del servicio", () => {
    expect(calculateCouponDiscount(3000, { type: "FIXED", value: 9999 })).toBe(3000);
    expect(calculateCouponDiscount(3000, { type: "PERCENTAGE", value: 150 })).toBe(3000);
  });

  it("ignora cupones con valores inválidos o negativos", () => {
    expect(calculateCouponDiscount(3000, { type: "FIXED", value: -500 })).toBe(0);
    expect(calculateCouponDiscount(3000, { type: "PERCENTAGE", value: NaN })).toBe(0);
  });

  it("devuelve cero para precios no válidos", () => {
    expect(calculateCouponDiscount(0, { type: "PERCENTAGE", value: 50 })).toBe(0);
    expect(calculateCouponDiscount(NaN, { type: "FIXED", value: 100 })).toBe(0);
  });
});

describe("applyDiscount", () => {
  it("resta el descuento del precio", () => {
    expect(applyDiscount(5000, 1000)).toBe(4000);
  });

  it("nunca baja de cero", () => {
    expect(applyDiscount(1000, 5000)).toBe(0);
  });

  it("devuelve el precio intacto si no hay descuento", () => {
    expect(applyDiscount(5000, 0)).toBe(5000);
  });
});

describe("cobro con cupón (regresión)", () => {
  // El cupón se consumía pero el cobro se calculaba sobre el precio de lista:
  // el cliente usaba el cupón y pagaba igual el precio completo.
  const PRICE = 5000;
  const coupon = { type: "PERCENTAGE", value: 20 };

  it("cobra el total ya descontado cuando el pago es del 100%", () => {
    const discount = calculateCouponDiscount(PRICE, coupon);
    const amount = calculatePaymentAmount(applyDiscount(PRICE, discount), "FULL");

    expect(amount).toBe(4000);
    expect(amount).not.toBe(PRICE);
  });

  it("calcula la seña sobre el precio con descuento", () => {
    const discount = calculateCouponDiscount(PRICE, coupon);
    const amount = calculatePaymentAmount(applyDiscount(PRICE, discount), "PERCENTAGE", 50);

    // 50% de 4000, no de 5000
    expect(amount).toBe(2000);
  });

  it("una seña fija nunca supera el precio ya descontado", () => {
    const discount = calculateCouponDiscount(PRICE, { type: "PERCENTAGE", value: 90 });
    const amount = calculatePaymentAmount(applyDiscount(PRICE, discount), "FIXED", null, 2000);

    expect(amount).toBe(500);
  });
});
