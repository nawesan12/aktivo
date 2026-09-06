import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const vibrate = vi.fn();

beforeEach(() => {
  vibrate.mockReset().mockReturnValue(true);
  vi.stubGlobal("navigator", { vibrate });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("el golpecito al tocar", () => {
  it("cada tipo tiene su patrón, y todos son cortos", async () => {
    const { haptic } = await import("@/lib/haptics");

    haptic("toque");
    haptic("logro");
    haptic("error");

    const [toque, logro, error] = vibrate.mock.calls.map((c) => c[0]);
    expect(toque).toBe(10);
    expect(logro).not.toEqual(error);

    // Nada largo: una vibración de medio segundo se siente como una falla del
    // teléfono, no como una respuesta al toque.
    const total = (p: number | number[]) =>
      typeof p === "number" ? p : p.reduce((a, b) => a + b, 0);
    for (const patron of [toque, logro, error]) {
      expect(total(patron)).toBeLessThan(200);
    }
  });

  it("por defecto es el toque", async () => {
    const { haptic } = await import("@/lib/haptics");
    haptic();
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  /*
    En iPhone `navigator.vibrate` no existe —iOS no expone la Vibration API, ni
    en Safari ni en una aplicación instalada—, así que esto se ejecuta en cada
    toque de la mitad de los teléfonos y no puede tirar nada abajo.
  */
  it("donde no existe la API, no rompe nada", async () => {
    vi.stubGlobal("navigator", {});
    const { haptic } = await import("@/lib/haptics");
    expect(() => haptic("logro")).not.toThrow();
  });

  it("si el navegador se niega, tampoco", async () => {
    vibrate.mockImplementation(() => {
      throw new Error("no permitido sin interacción previa");
    });
    const { haptic } = await import("@/lib/haptics");
    expect(() => haptic()).not.toThrow();
  });
});

describe("los avisos vibran solos", () => {
  it("un éxito y un error se sienten distinto", async () => {
    const { toast } = await import("@/lib/toast");

    toast.success("guardado");
    const exito = vibrate.mock.calls.at(-1)?.[0];

    toast.error("falló");
    const fallo = vibrate.mock.calls.at(-1)?.[0];

    expect(exito).toBeDefined();
    expect(fallo).toBeDefined();
    expect(exito).not.toEqual(fallo);
  });

  it("y las demás formas de avisar siguen funcionando", async () => {
    const { toast } = await import("@/lib/toast");
    // `toast(...)` como función, no sólo `toast.success(...)`.
    expect(() => toast("algo pasó")).not.toThrow();
    expect(() => toast.dismiss()).not.toThrow();
  });
});
