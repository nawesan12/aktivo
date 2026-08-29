import { describe, it, expect } from "vitest";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

describe("formatCurrency", () => {
  it("usa el formato argentino sin centavos", () => {
    expect(formatCurrency(12500)).toBe("$ 12.500");
  });

  it("redondea en lugar de mostrar centavos por defecto", () => {
    expect(formatCurrency(12500.4)).toBe("$ 12.500");
  });

  it("muestra decimales cuando se piden", () => {
    expect(formatCurrency(12500.5, { decimals: 2 })).toBe("$ 12.500,50");
  });

  it("acepta otra moneda", () => {
    expect(formatCurrency(1000, { currency: "USD" })).toContain("1.000");
  });

  it("no rompe con valores inválidos", () => {
    expect(formatCurrency(NaN)).toBe("$ 0");
    expect(formatCurrency(Infinity)).toBe("$ 0");
  });

  it("no deja espacios duros, que algunas fuentes de PDF dibujan como un cuadrado", () => {
    expect(formatCurrency(1000)).not.toContain(" ");
  });
});

describe("formatNumber", () => {
  it("separa los miles", () => {
    expect(formatNumber(1234567)).toBe("1.234.567");
  });

  it("respeta los decimales pedidos", () => {
    expect(formatNumber(12.345, 2)).toBe("12,35");
  });
});

describe("formatPercent", () => {
  it("agrega el símbolo", () => {
    expect(formatPercent(87)).toBe("87%");
    expect(formatPercent(12.5, 1)).toBe("12,5%");
  });
});
