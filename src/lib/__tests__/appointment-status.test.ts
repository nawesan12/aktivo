import { describe, it, expect } from "vitest";
import {
  APPOINTMENT_STATUS_ORDER,
  APPOINTMENT_STATUS_OPTIONS,
  APPOINTMENT_STATUS_STYLES,
  isTerminal,
  statusLabel,
  statusStyle,
} from "@/lib/appointment-status";

describe("estilos de estado", () => {
  it("cubre todos los estados del schema", () => {
    expect(APPOINTMENT_STATUS_ORDER).toHaveLength(6);
    for (const status of APPOINTMENT_STATUS_ORDER) {
      expect(APPOINTMENT_STATUS_STYLES[status]).toBeDefined();
    }
  });

  it("no repite un color entre dos estados", () => {
    // El bug original: COMPLETED y CONFIRMED se veían iguales o cambiados
    // según la pantalla.
    const dots = APPOINTMENT_STATUS_ORDER.map((s) => APPOINTMENT_STATUS_STYLES[s].dot);
    expect(new Set(dots).size).toBe(dots.length);
  });

  it("da un estilo neutro ante un estado desconocido en vez de romper", () => {
    const style = statusStyle("ALGO_NUEVO");
    expect(style.label).toBe("Desconocido");
    expect(style.badge).toContain("muted");
  });

  it("expone la etiqueta en castellano", () => {
    expect(statusLabel("PENDING_PAYMENT")).toBe("Pago pendiente");
    expect(statusLabel("NO_SHOW")).toBe("No asistió");
  });
});

describe("opciones para filtros", () => {
  it("incluye todos los estados en orden", () => {
    expect(APPOINTMENT_STATUS_OPTIONS.map((o) => o.value)).toEqual(APPOINTMENT_STATUS_ORDER);
  });
});

describe("estados terminales", () => {
  it("reconoce los que ya no admiten acciones", () => {
    expect(isTerminal("COMPLETED")).toBe(true);
    expect(isTerminal("CANCELLED")).toBe(true);
    expect(isTerminal("NO_SHOW")).toBe(true);
  });

  it("deja abiertos los que sí las admiten", () => {
    expect(isTerminal("PENDING")).toBe(false);
    expect(isTerminal("CONFIRMED")).toBe(false);
    expect(isTerminal("PENDING_PAYMENT")).toBe(false);
  });
});
