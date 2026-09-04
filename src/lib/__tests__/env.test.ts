import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Each case reloads the module: `env.ts` caches the parsed result on first
 * access on purpose, so a fresh import is the only way to test a different
 * configuration.
 */
async function loadWith(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  const base: Record<string, string | undefined> = {
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://u:p@localhost:5432/db",
    AUTH_SECRET: "a-secret-long-enough-to-pass",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v === undefined) vi.stubEnv(k, "");
    else vi.stubEnv(k, v);
  }
  return import("@/lib/env");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("validación de entorno", () => {
  it("acepta una configuración mínima válida", async () => {
    const { assertEnv } = await loadWith({});
    expect(() => assertEnv()).not.toThrow();
  });

  it("rechaza un DATABASE_URL que no es postgres", async () => {
    const { assertEnv } = await loadWith({ DATABASE_URL: "mysql://u:p@host/db" });
    expect(() => assertEnv()).toThrow(/postgres/);
  });

  it("rechaza en producción una integración configurada a medias", async () => {
    // Un cobro de suscripciones con token pero sin los IDs de plan arranca,
    // parece habilitado, y falla recién cuando un negocio intenta suscribirse.
    const { assertEnv } = await loadWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://jikuapp.com",
      CRON_SECRET: "a-cron-secret-long-enough",
      MP_PLATFORM_ACCESS_TOKEN: "token",
      MP_PLAN_PROFESSIONAL_ID: "plan-pro",
    });
    expect(() => assertEnv()).toThrow(/half configured/);
  });

  it("en desarrollo solo advierte, para no exigir credenciales que no hacen falta", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { assertEnv } = await loadWith({
      MP_PLATFORM_ACCESS_TOKEN: "token",
      MP_PLAN_PROFESSIONAL_ID: "plan-pro",
    });
    expect(() => assertEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("half configured"));
    warn.mockRestore();
  });

  it("acepta la integración completa", async () => {
    const { assertEnv } = await loadWith({
      MP_PLATFORM_ACCESS_TOKEN: "token",
      MP_PLAN_PROFESSIONAL_ID: "plan-pro",
      MP_PLAN_ENTERPRISE_ID: "plan-enterprise",
    });
    expect(() => assertEnv()).not.toThrow();
  });

  it("exige CRON_SECRET en producción", async () => {
    const { assertEnv } = await loadWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://jiku.app",
    });
    expect(() => assertEnv()).toThrow(/CRON_SECRET/);
  });

  it("rechaza una URL sin https en producción", async () => {
    const { assertEnv } = await loadWith({
      NODE_ENV: "production",
      CRON_SECRET: "a-cron-secret-long-enough",
      NEXT_PUBLIC_APP_URL: "http://jiku.app",
    });
    expect(() => assertEnv()).toThrow(/https/);
  });
});

describe("appUrl", () => {
  it("arma URLs absolutas sin barras duplicadas", async () => {
    const { appUrl } = await loadWith({ NEXT_PUBLIC_APP_URL: "https://jiku.app/" });
    expect(appUrl("/review/abc")).toBe("https://jiku.app/review/abc");
    expect(appUrl("review/abc")).toBe("https://jiku.app/review/abc");
    expect(appUrl()).toBe("https://jiku.app");
  });
});

describe("integrationStatus", () => {
  it("reporta apagado lo que no está configurado", async () => {
    const { integrationStatus } = await loadWith({});
    const status = integrationStatus();
    expect(status.email).toBe(false);
    expect(status.mercadopago).toBe(false);
    expect(status.cron).toBe(false);
  });
});

describe("appUrl durante el build", () => {
  it("no explota cuando falta NEXT_PUBLIC_APP_URL", async () => {
    /*
      En la fase de build `loadEnv()` no valida a propósito: devuelve
      `process.env` tal cual y avisa. Con la variable ausente, `appUrl` llamaba
      `.replace` sobre undefined y tiraba un TypeError mientras Next juntaba los
      datos de `/_not-found` — la primera ruta que evalúa. El build entero se
      caía con un error que no nombraba la variable en ningún lado, y sólo en
      los entornos donde la variable está limitada a producción.
    */
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    const { appUrl } = await loadWith({ NEXT_PUBLIC_APP_URL: undefined });

    expect(() => appUrl("/turnos")).not.toThrow();
    expect(appUrl("/turnos")).toMatch(/^https?:\/\/.+\/turnos$/);
  });

  it("usa la variable cuando está, sin barra de más", async () => {
    const { appUrl } = await loadWith({ NEXT_PUBLIC_APP_URL: "https://jikuapp.com/" });
    expect(appUrl("/el-corte")).toBe("https://jikuapp.com/el-corte");
  });
});
