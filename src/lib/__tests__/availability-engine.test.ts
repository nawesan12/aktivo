import { describe, it, expect } from "vitest";
import { computeSlotsForDay, type AvailabilityData, type TimeSlot } from "../availability-engine";
import { toArgentinaDate } from "../timezone";

// A fixed Tuesday, expressed in Argentina time (UTC-3, no DST).
const DAY = "2026-09-15";
const TEST_DATE = new Date(`${DAY}T12:00:00-03:00`);
const DAY_OF_WEEK = toArgentinaDate(TEST_DATE).getDay();

/** The day before, so `minHoursAdvance` never interferes with the assertions. */
const NOW = new Date("2026-09-14T00:00:00-03:00");

/** Builds an instant of the test day from a "HH:mm" string, in Argentina time. */
function at(time: string): Date {
  return new Date(`${DAY}T${time}:00-03:00`);
}

function baseData(overrides: Partial<AvailabilityData> = {}): AvailabilityData {
  return {
    workingHours: [
      { dayOfWeek: DAY_OF_WEEK, startTime: "09:00", endTime: "18:00", isActive: true },
    ],
    appointments: [],
    blockedDates: [],
    recurringBlocked: [],
    dateOverrides: [],
    ...overrides,
  };
}

function slotAt(slots: TimeSlot[], time: string): TimeSlot | undefined {
  return slots.find((s) => s.display === time);
}

describe("computeSlotsForDay", () => {
  describe("conflictos con turnos existentes", () => {
    it("bloquea un horario cuyo servicio se solaparía con un turno que empieza después", () => {
      // Regresión: con la comprobación vieja (solo el inicio del slot dentro del turno),
      // las 10:00 se ofrecían y el servicio de 60' pisaba el turno de las 10:30.
      const data = baseData({
        appointments: [{ dateTime: at("10:30"), endTime: at("11:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 60,
        now: NOW,
      });

      expect(slotAt(slots, "10:00")?.available).toBe(false);
    });

    it("bloquea el horario que arranca dentro de un turno existente", () => {
      const data = baseData({
        appointments: [{ dateTime: at("10:00"), endTime: at("11:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 30,
        now: NOW,
      });

      expect(slotAt(slots, "10:30")?.available).toBe(false);
    });

    it("permite reservar justo cuando termina el turno anterior", () => {
      const data = baseData({
        appointments: [{ dateTime: at("09:00"), endTime: at("10:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 60,
        now: NOW,
      });

      expect(slotAt(slots, "10:00")?.available).toBe(true);
    });

    it("permite reservar justo antes de que empiece el turno siguiente", () => {
      const data = baseData({
        appointments: [{ dateTime: at("11:00"), endTime: at("12:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 60,
        now: NOW,
      });

      expect(slotAt(slots, "10:00")?.available).toBe(true);
    });

    it("bloquea un turno que envuelve por completo a uno existente", () => {
      const data = baseData({
        appointments: [{ dateTime: at("10:15"), endTime: at("10:30") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 120,
        now: NOW,
      });

      expect(slotAt(slots, "10:00")?.available).toBe(false);
    });

    it("deja libre el resto del día", () => {
      const data = baseData({
        appointments: [{ dateTime: at("10:30"), endTime: at("11:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 60,
        now: NOW,
      });

      expect(slotAt(slots, "09:00")?.available).toBe(true);
      expect(slotAt(slots, "11:00")?.available).toBe(true);
    });
  });

  describe("buffer entre turnos", () => {
    it("reserva el tiempo de buffer después del servicio", () => {
      const data = baseData({
        appointments: [{ dateTime: at("11:00"), endTime: at("12:00") }],
      });

      // 10:30 + 30' de servicio termina 11:00, pero con 15' de buffer llega a 11:15
      // y pisa el turno de las 11:00.
      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 30,
        bufferMinutes: 15,
        now: NOW,
      });

      expect(slotAt(slots, "10:30")?.available).toBe(false);
      expect(slotAt(slots, "10:00")?.available).toBe(true);
    });

    it("reserva el buffer del turno anterior", () => {
      const data = baseData({
        appointments: [{ dateTime: at("09:00"), endTime: at("10:00") }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 30,
        bufferMinutes: 15,
        now: NOW,
      });

      // El turno termina 10:00 y su buffer se extiende hasta 10:15.
      expect(slotAt(slots, "10:00")?.available).toBe(false);
      expect(slotAt(slots, "10:30")?.available).toBe(true);
    });
  });

  describe("horario de atención", () => {
    it("no ofrece horarios cuyo servicio termine después del cierre", () => {
      const data = baseData({
        workingHours: [
          { dayOfWeek: DAY_OF_WEEK, startTime: "09:00", endTime: "12:00", isActive: true },
        ],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, {
        serviceDuration: 60,
        now: NOW,
      });

      expect(slotAt(slots, "11:00")).toBeDefined();
      expect(slotAt(slots, "11:30")).toBeUndefined();
      expect(slots.at(-1)?.display).toBe("11:00");
    });

    it("devuelve vacío si el profesional no trabaja ese día", () => {
      const data = baseData({
        workingHours: [
          { dayOfWeek: (DAY_OF_WEEK + 1) % 7, startTime: "09:00", endTime: "18:00", isActive: true },
        ],
      });

      expect(computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW })).toEqual([]);
    });

    it("devuelve vacío si el día está marcado como inactivo", () => {
      const data = baseData({
        workingHours: [
          { dayOfWeek: DAY_OF_WEEK, startTime: "09:00", endTime: "18:00", isActive: false },
        ],
      });

      expect(computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW })).toEqual([]);
    });
  });

  describe("anticipación mínima", () => {
    it("bloquea los horarios que caen dentro de la ventana mínima", () => {
      const slots = computeSlotsForDay(baseData(), TEST_DATE, {
        serviceDuration: 30,
        minHoursAdvance: 2,
        now: at("10:00"),
      });

      expect(slotAt(slots, "11:00")?.available).toBe(false);
      expect(slotAt(slots, "12:00")?.available).toBe(true);
    });
  });

  describe("bloqueos de agenda", () => {
    it("devuelve vacío ante un bloqueo de día completo", () => {
      const data = baseData({
        blockedDates: [{ date: at("00:00"), type: "FULL_DAY" }],
      });

      expect(computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW })).toEqual([]);
    });

    it("bloquea solo la franja de un bloqueo parcial", () => {
      const data = baseData({
        blockedDates: [
          { date: at("00:00"), type: "PARTIAL", startTime: "12:00", endTime: "14:00" },
        ],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW });

      expect(slotAt(slots, "11:00")?.available).toBe(true);
      expect(slotAt(slots, "12:00")?.available).toBe(false);
      expect(slotAt(slots, "13:30")?.available).toBe(false);
      expect(slotAt(slots, "14:00")?.available).toBe(true);
    });

    it("ignora bloqueos que corresponden a otro día", () => {
      const data = baseData({
        blockedDates: [{ date: new Date("2026-09-16T00:00:00-03:00"), type: "FULL_DAY" }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW });

      expect(slots.length).toBeGreaterThan(0);
    });

    it("bloquea los horarios recurrentes del día de la semana", () => {
      const data = baseData({
        recurringBlocked: [{ dayOfWeek: DAY_OF_WEEK, time: "13:00" }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW });

      expect(slotAt(slots, "13:00")?.available).toBe(false);
      expect(slotAt(slots, "13:30")?.available).toBe(true);
    });

    it("una excepción AVAILABLE del día habilita un horario recurrentemente bloqueado", () => {
      const data = baseData({
        recurringBlocked: [{ dayOfWeek: DAY_OF_WEEK, time: "13:00" }],
        dateOverrides: [{ date: at("00:00"), time: "13:00", type: "AVAILABLE" }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW });

      expect(slotAt(slots, "13:00")?.available).toBe(true);
    });

    it("una excepción BLOCKED del día pisa la disponibilidad normal", () => {
      const data = baseData({
        dateOverrides: [{ date: at("00:00"), time: "15:00", type: "BLOCKED" }],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 30, now: NOW });

      expect(slotAt(slots, "15:00")?.available).toBe(false);
    });
  });

  describe("aislamiento entre días", () => {
    it("no tiene en cuenta turnos de otro día", () => {
      const data = baseData({
        appointments: [
          {
            dateTime: new Date("2026-09-16T10:00:00-03:00"),
            endTime: new Date("2026-09-16T11:00:00-03:00"),
          },
        ],
      });

      const slots = computeSlotsForDay(data, TEST_DATE, { serviceDuration: 60, now: NOW });

      expect(slotAt(slots, "10:00")?.available).toBe(true);
    });
  });
});
