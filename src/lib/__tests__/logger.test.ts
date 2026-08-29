import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { createLogger } from "@/lib/logger";

/**
 * The logger writes through `console`, so the assertions read what would land
 * in Vercel's log drain.
 */
const spies = {
  log: vi.spyOn(console, "log").mockImplementation(() => {}),
  warn: vi.spyOn(console, "warn").mockImplementation(() => {}),
  error: vi.spyOn(console, "error").mockImplementation(() => {}),
};

beforeEach(() => {
  vi.stubEnv("LOG_LEVEL", "debug");
});

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("logger en desarrollo", () => {
  it("prefija con el scope y adjunta el contexto", () => {
    createLogger("cron:reminders").info("sent", { count: 3 });
    expect(spies.log).toHaveBeenCalledWith("[cron:reminders]", "sent", { count: 3 });
  });

  it("compone el scope de los hijos", () => {
    createLogger("whatsapp").child("send").warn("not configured");
    expect(spies.warn).toHaveBeenCalledWith("[whatsapp:send]", "not configured");
  });

  it("hereda el contexto del padre", () => {
    createLogger("api", { businessId: "b1" }).child("appointments").info("created", { id: "a1" });
    expect(spies.log).toHaveBeenCalledWith("[api:appointments]", "created", {
      businessId: "b1",
      id: "a1",
    });
  });

  it("respeta el nivel mínimo", () => {
    vi.stubEnv("LOG_LEVEL", "warn");
    const log = createLogger("test");
    log.debug("no");
    log.info("no");
    log.warn("sí");
    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalled();
  });
});

describe("serialización de errores", () => {
  it("conserva mensaje, stack y código en vez de un objeto vacío", () => {
    const error = Object.assign(new Error("boom"), { code: "P2002" });
    createLogger("db").error("insert failed", error, { table: "Appointment" });

    const [, , fields] = spies.error.mock.calls[0] as [string, string, Record<string, unknown>];
    const serialised = fields.error as Record<string, unknown>;
    expect(serialised.message).toBe("boom");
    expect(serialised.code).toBe("P2002");
    expect(serialised.stack).toBeTruthy();
    expect(fields.table).toBe("Appointment");
  });

  it("no rompe con valores que no son Error", () => {
    createLogger("db").error("weird", "just a string");
    const [, , fields] = spies.error.mock.calls[0] as [string, string, Record<string, unknown>];
    expect((fields.error as Record<string, unknown>).message).toBe("just a string");
  });
});

describe("redacción", () => {
  it("no imprime valores de campos sensibles", () => {
    createLogger("auth").info("login", {
      email: "a@b.com",
      password: "hunter2",
      accessToken: "secreto",
    });
    expect(spies.log).toHaveBeenCalledWith("[auth]", "login", {
      email: "a@b.com",
      password: "[redacted]",
      accessToken: "[redacted]",
    });
  });
});

describe("logger en producción", () => {
  it("emite una línea JSON parseable", () => {
    vi.stubEnv("NODE_ENV", "production");
    createLogger("webhook:mercadopago").warn("invalid signature", { paymentId: "123" });

    const [line] = spies.warn.mock.calls[0] as [string];
    const parsed = JSON.parse(line);
    expect(parsed.level).toBe("warn");
    expect(parsed.scope).toBe("webhook:mercadopago");
    expect(parsed.message).toBe("invalid signature");
    expect(parsed.paymentId).toBe("123");
    expect(parsed.timestamp).toBeTruthy();
  });
});
