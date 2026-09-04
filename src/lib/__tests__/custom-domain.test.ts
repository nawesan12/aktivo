import { describe, it, expect, vi } from "vitest";

const businessFindFirst = vi.fn();
vi.mock("@/lib/db", () => ({
  db: { business: { findFirst: (...a: unknown[]) => businessFindFirst(...a) } },
}));

vi.mock("@/lib/env", () => ({
  env: {
    VERCEL_API_TOKEN: "token",
    VERCEL_PROJECT_ID: "prj_1",
    VERCEL_TEAM_ID: undefined,
    NEXT_PUBLIC_APP_URL: "https://jikuapp.com",
  },
}));

const { normalizeDomain, businessSlugForHost } = await import("@/lib/custom-domain");

describe("normalizeDomain", () => {
  it("acepta un dominio escrito como lo escribe una persona", () => {
    expect(normalizeDomain("  HTTPS://MiBarberia.com/turnos  ")).toBe("mibarberia.com");
    expect(normalizeDomain("turnos.mibarberia.com.ar")).toBe("turnos.mibarberia.com.ar");
  });

  it("rechaza lo que nunca podría coincidir con un host entrante", () => {
    expect(() => normalizeDomain("mi barberia")).toThrow();
    expect(() => normalizeDomain("mibarberia")).toThrow();
    expect(() => normalizeDomain("-mibarberia.com")).toThrow();
    expect(() => normalizeDomain("mibarberia.com:3000")).toThrow();
  });

  it("no deja que un negocio se quede con el dominio de la plataforma", () => {
    // Handing this over would take the marketing site and every panel with it.
    expect(() => normalizeDomain("jikuapp.com")).toThrow();
    expect(() => normalizeDomain("www.jikuapp.com")).toThrow();
    expect(() => normalizeDomain("cualquiera.jikuapp.com")).toThrow();
    expect(() => normalizeDomain("jiku-preview.vercel.app")).toThrow();
  });
});

describe("businessSlugForHost", () => {
  it("resuelve el negocio ignorando el www y el puerto", async () => {
    businessFindFirst.mockResolvedValue({ slug: "el-corte" });

    await expect(businessSlugForHost("WWW.MiBarberia.com:443")).resolves.toBe("el-corte");
    expect(businessFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ customDomain: "mibarberia.com" }),
      })
    );
  });

  it("sólo resuelve dominios que terminaron de verificarse", async () => {
    // A half-configured domain would otherwise serve the page over a
    // certificate that does not cover it.
    businessFindFirst.mockResolvedValue(null);
    await expect(businessSlugForHost("apenas-agregado.com")).resolves.toBeNull();

    const where = businessFindFirst.mock.calls.at(-1)?.[0].where;
    expect(where.customDomainStatus).toBe("ACTIVE");
    expect(where.isActive).toBe(true);
  });
});
