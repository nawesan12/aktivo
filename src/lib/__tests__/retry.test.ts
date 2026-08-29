import { describe, it, expect, vi } from "vitest";
import { withRetry } from "@/lib/retry";

describe("withRetry", () => {
  it("no reintenta cuando la primera vez sale bien", async () => {
    const operation = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(operation)).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("reintenta ante un error transitorio y devuelve el resultado", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("WhatsApp API error: HTTP 503"))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("agota los intentos y propaga el último error", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("HTTP 500"));

    await expect(
      withRetry(operation, { attempts: 3, baseDelayMs: 1 })
    ).rejects.toThrow("HTTP 500");
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it("no reintenta un 400: la petición está mal, repetirla no la arregla", async () => {
    const operation = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("bad number"), { status: 400 }));

    await expect(withRetry(operation, { baseDelayMs: 1 })).rejects.toThrow("bad number");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("sí reintenta un 429, que es exactamente lo transitorio", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("throttled"), { status: 429 }))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("reintenta un fallo de red, que no trae status", async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValue("ok");

    await expect(withRetry(operation, { baseDelayMs: 1 })).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it("respeta un shouldRetry propio", async () => {
    const operation = vi.fn().mockRejectedValue(new Error("nope"));

    await expect(
      withRetry(operation, { baseDelayMs: 1, shouldRetry: () => false })
    ).rejects.toThrow("nope");
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("espera más en cada intento", async () => {
    const started = Date.now();
    const operation = vi.fn().mockRejectedValue(new Error("HTTP 500"));

    await expect(
      withRetry(operation, { attempts: 3, baseDelayMs: 20 })
    ).rejects.toThrow();

    // 20ms + 40ms como mínimo, sin contar el jitter.
    expect(Date.now() - started).toBeGreaterThanOrEqual(55);
  });
});
