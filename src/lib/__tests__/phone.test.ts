import { describe, it, expect } from "vitest";
import {
  formatPhoneForDisplay,
  isValidArgentinePhone,
  nationalDigits,
  normalisePhone,
  toWhatsAppFormat,
} from "@/lib/phone";

describe("normalización", () => {
  it("acepta las formas en que la gente realmente escribe su número", () => {
    const expected = "2236327551";
    for (const input of [
      "2236327551",
      "223 632-7551",
      "0223 632 7551",
      "0223 15 632-7551",
      "+54 223 632 7551",
      "+54 9 223 632 7551",
      "5492236327551",
      "00549 223 6327551",
    ]) {
      expect(nationalDigits(input), input).toBe(expected);
    }
  });

  it("maneja el código de área de dos dígitos de Buenos Aires", () => {
    expect(nationalDigits("+54 9 11 4123-4567")).toBe("1141234567");
  });
});

describe("validación", () => {
  it("acepta números válidos", () => {
    expect(isValidArgentinePhone("+54 9 223 632-7551")).toBe(true);
    expect(isValidArgentinePhone("1141234567")).toBe(true);
  });

  it("rechaza los que la validación anterior dejaba pasar", () => {
    // z.string().min(10) aceptaba cualquiera de estos.
    expect(isValidArgentinePhone("0000000000")).toBe(false);
    expect(isValidArgentinePhone("1111111111")).toBe(false);
    expect(isValidArgentinePhone("no es un teléfono")).toBe(false);
  });

  it("rechaza longitudes que no existen", () => {
    expect(isValidArgentinePhone("12345")).toBe(false);
    expect(isValidArgentinePhone("22363275510000")).toBe(false);
  });
});

describe("formato para almacenar y enviar", () => {
  it("guarda una única forma canónica", () => {
    expect(normalisePhone("0223 15 632-7551")).toBe("+5492236327551");
    expect(normalisePhone("+54 9 223 632 7551")).toBe("+5492236327551");
  });

  it("saca el 9 para la API de Meta, que si no descarta el mensaje", () => {
    expect(toWhatsAppFormat("+54 9 223 632-7551")).toBe("542236327551");
    expect(toWhatsAppFormat("2236327551")).toBe("542236327551");
  });

  it("devuelve algo utilizable aunque el número sea raro", () => {
    expect(normalisePhone("12345")).toBe("12345");
    expect(toWhatsAppFormat("12345")).toBe("12345");
  });
});

describe("presentación", () => {
  it("agrupa como se lee en voz alta", () => {
    expect(formatPhoneForDisplay("+5492236327551")).toBe("223 632-7551");
    expect(formatPhoneForDisplay("1141234567")).toBe("11 4123-4567");
  });
});
