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
    // Un WhatsApp con token pero sin app secret arranca, parece habilitado, y
    // el webhook rechaza todo: falla en silencio hasta que un cliente reclama.
    const { assertEnv } = await loadWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_APP_URL: "https://jiku.app",
      CRON_SECRET: "a-cron-secret-long-enough",
      WHATSAPP_ACCESS_TOKEN: "token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
    });
    expect(() => assertEnv()).toThrow(/half configured/);
  });

  it("en desarrollo solo advierte, para no exigir credenciales que no hacen falta", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { assertEnv } = await loadWith({
      WHATSAPP_ACCESS_TOKEN: "token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
    });
    expect(() => assertEnv()).not.toThrow();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("half configured"));
    warn.mockRestore();
  });

  it("acepta la integración completa", async () => {
    const { assertEnv } = await loadWith({
      WHATSAPP_ACCESS_TOKEN: "token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
      WHATSAPP_VERIFY_TOKEN: "verify",
      WHATSAPP_APP_SECRET: "secret",
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
    expect(status.whatsapp).toBe(false);
    expect(status.email).toBe(false);
    expect(status.cron).toBe(false);
  });
});
