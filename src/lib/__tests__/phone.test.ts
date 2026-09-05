import { describe, it, expect } from "vitest";
import {
  formatPhoneForDisplay,
  isValidArgentinePhone,
  nationalDigits,
  normalisePhone,
  phoneLookupVariants,
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

  it("devuelve algo utilizable aunque el número sea raro", () => {
    expect(normalisePhone("12345")).toBe("12345");
  });
});

describe("presentación", () => {
  it("agrupa como se lee en voz alta", () => {
    expect(formatPhoneForDisplay("+5492236327551")).toBe("223 632-7551");
    expect(formatPhoneForDisplay("1141234567")).toBe("11 4123-4567");
  });
});

/*
  La función que decide si encontramos a alguien por su número. No tenía tests,
  y es exactamente la que falla cuando un cliente escribe su teléfono y le
  contestamos que no hay turnos con ese número.
*/
describe("búsqueda por número", () => {
  it("encuentra una fila guardada en cualquiera de las formas históricas", () => {
    const variants = phoneLookupVariants("223 632-7551");

    for (const stored of [
      "2236327551",
      "02236327551",
      "542236327551",
      "+542236327551",
      "5492236327551",
      "+5492236327551",
    ]) {
      expect(variants, stored).toContain(stored);
    }
  });

  it("llega a la misma fila se escriba como se escriba", () => {
    const canonical = normalisePhone("2236327551");
    for (const typed of ["0223 15 632-7551", "+54 9 223 632 7551", "223 632 7551"]) {
      expect(phoneLookupVariants(typed), typed).toContain(canonical);
    }
  });

  it("no devuelve cadenas vacías, que harían coincidir a cualquiera", () => {
    expect(phoneLookupVariants("")).toEqual([]);
    expect(phoneLookupVariants("   ")).toEqual([]);
  });

  it("con un número inválido no inventa variantes canónicas", () => {
    // "12345" no es un teléfono: sólo se busca tal cual se escribió.
    expect(phoneLookupVariants("12345")).toEqual(["12345"]);
  });
});
