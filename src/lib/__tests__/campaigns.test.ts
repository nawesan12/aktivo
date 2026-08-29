import { describe, it, expect } from "vitest";
import { triggerDays, cooldownDays } from "@/lib/campaigns/audience";

type Trigger = Parameters<typeof triggerDays>[0];

const campaign = (type: string, triggerConfig: unknown = null) =>
  ({ type, triggerConfig } as unknown as Trigger);

describe("umbral del disparador", () => {
  it("lee la configuración de re-booking", () => {
    expect(triggerDays(campaign("REBOOKING", { rebookingDays: 45 }))).toBe(45);
  });

  it("lee la configuración de inactividad", () => {
    expect(triggerDays(campaign("INACTIVITY", { inactivityDays: 120 }))).toBe(120);
  });

  it("usa un valor por defecto cuando la campaña se guardó sin umbral", () => {
    expect(triggerDays(campaign("REBOOKING", null))).toBe(30);
    expect(triggerDays(campaign("INACTIVITY", {}))).toBe(90);
  });

  it("ignora valores inválidos en vez de disparar con NaN", () => {
    expect(triggerDays(campaign("REBOOKING", { rebookingDays: "muchos" }))).toBe(30);
    expect(triggerDays(campaign("INACTIVITY", { inactivityDays: 0 }))).toBe(90);
    expect(triggerDays(campaign("INACTIVITY", { inactivityDays: -5 }))).toBe(90);
  });
});

describe("período de espera entre envíos", () => {
  it("el cumpleaños se repite una vez al año", () => {
    expect(cooldownDays(campaign("BIRTHDAY"))).toBe(300);
  });

  it("una campaña personalizada nunca se reenvía a la misma persona", () => {
    expect(cooldownDays(campaign("CUSTOM"))).toBe(Number.POSITIVE_INFINITY);
  });

  it("los recordatorios usan su propio umbral como espera", () => {
    // Sin esto, el cron diario mandaría el mismo "te extrañamos" cada mañana.
    expect(cooldownDays(campaign("INACTIVITY", { inactivityDays: 120 }))).toBe(120);
  });

  it("nunca baja de 30 días, por más chico que sea el umbral", () => {
    expect(cooldownDays(campaign("REBOOKING", { rebookingDays: 3 }))).toBe(30);
  });
});
