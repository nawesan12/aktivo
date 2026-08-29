import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The in-memory limiter, which is what runs when Upstash is not configured.
 * Each case reloads the module so counters start clean.
 */
async function load() {
  vi.resetModules();
  return import("@/lib/rate-limit");
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe("rateLimit", () => {
  it("deja pasar hasta el límite y luego corta", async () => {
    const { rateLimit } = await load();
    const budget = { key: "test:a", limit: 3, windowMs: 60_000 };

    expect((await rateLimit(budget)).success).toBe(true);
    expect((await rateLimit(budget)).success).toBe(true);
    expect((await rateLimit(budget)).success).toBe(true);
    expect((await rateLimit(budget)).success).toBe(false);
  });

  it("lleva presupuestos separados por clave", async () => {
    const { rateLimit } = await load();
    await rateLimit({ key: "test:a", limit: 1, windowMs: 60_000 });

    expect((await rateLimit({ key: "test:a", limit: 1, windowMs: 60_000 })).success).toBe(false);
    expect((await rateLimit({ key: "test:b", limit: 1, windowMs: 60_000 })).success).toBe(true);
  });

  it("olvida los intentos viejos al pasar la ventana", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await load();
    const budget = { key: "test:window", limit: 1, windowMs: 1_000 };

    expect((await rateLimit(budget)).success).toBe(true);
    expect((await rateLimit(budget)).success).toBe(false);

    vi.advanceTimersByTime(1_500);
    expect((await rateLimit(budget)).success).toBe(true);
    vi.useRealTimers();
  });
});

describe("peekRateLimit", () => {
  it("no gasta intentos", async () => {
    const { rateLimit, peekRateLimit } = await load();
    const budget = { key: "test:peek", limit: 2, windowMs: 60_000 };

    // Mirar diez veces no consume nada: es lo que permite que un login
    // exitoso no cuente contra el presupuesto.
    for (let i = 0; i < 10; i++) {
      expect((await peekRateLimit(budget)).success).toBe(true);
    }

    expect((await rateLimit(budget)).success).toBe(true);
    expect((await rateLimit(budget)).success).toBe(true);
    expect((await peekRateLimit(budget)).success).toBe(false);
  });

  it("informa cuántos intentos quedan", async () => {
    const { rateLimit, peekRateLimit } = await load();
    const budget = { key: "test:remaining", limit: 3, windowMs: 60_000 };

    expect((await peekRateLimit(budget)).remaining).toBe(3);
    await rateLimit(budget);
    expect((await peekRateLimit(budget)).remaining).toBe(2);
  });
});

describe("getClientIP", () => {
  it("toma la primera dirección de x-forwarded-for", async () => {
    const { getClientIP } = await load();
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.10, 70.41.3.18" },
    });
    expect(getClientIP(request)).toBe("203.0.113.10");
  });

  it("devuelve algo utilizable cuando no hay cabecera", async () => {
    const { getClientIP } = await load();
    expect(getClientIP(new Request("http://localhost"))).toBeTruthy();
  });
});
