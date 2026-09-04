import { test, expect } from "@playwright/test";
import { getSlots, loadBookingFixture, testGuest, type BookingFixture } from "./fixtures";

/**
 * The rules the product sells: a booked slot is booked, two people cannot take
 * the same time, and a slot is not offered when the service would run over the
 * next appointment.
 *
 * These go through the API rather than the interface on purpose — the race
 * between two simultaneous bookings cannot be reproduced by clicking.
 *
 * Run `npx tsx scripts/e2e-cleanup.ts` to remove what they create.
 */

let fixture: BookingFixture;

test.beforeAll(async ({ request }) => {
  fixture = await loadBookingFixture(request);
});

async function freeSlot(request: import("@playwright/test").APIRequestContext) {
  const slots = await getSlots(
    request,
    fixture.slug,
    fixture.staff.id,
    fixture.service.id,
    fixture.service.duration,
    fixture.date
  );
  const free = slots.filter((s) => s.available);
  expect(free.length, "el día elegido se quedó sin horarios libres").toBeGreaterThan(0);
  return free[0].time;
}

function book(
  request: import("@playwright/test").APIRequestContext,
  slot: string,
  suffix: string
) {
  return request.post("/api/appointments", {
    data: {
      serviceId: fixture.service.id,
      staffId: fixture.staff.id,
      dateTime: slot,
      guest: testGuest(suffix),
    },
  });
}

test("una reserva queda registrada y su horario deja de ofrecerse", async ({ request }) => {
  const slot = await freeSlot(request);

  const response = await book(request, slot, "001");
  expect(response.status(), await response.text()).toBe(201);

  const appointment = await response.json();
  expect(appointment.id).toBeTruthy();

  const slots = await getSlots(
    request,
    fixture.slug,
    fixture.staff.id,
    fixture.service.id,
    fixture.service.duration,
    fixture.date
  );
  const taken = slots.find((s) => s.time === slot);
  expect(taken?.available ?? false, "el horario reservado se sigue ofreciendo").toBe(false);
});

test("dos reservas simultáneas al mismo horario: gana una sola", async ({ request }) => {
  const slot = await freeSlot(request);

  const [a, b] = await Promise.all([book(request, slot, "002"), book(request, slot, "003")]);
  const statuses = [a.status(), b.status()].sort();

  // El perdedor recibe 409 SLOT_TAKEN — no un segundo turno, ni un 500.
  expect(statuses, `respuestas: ${statuses.join(", ")}`).toEqual([201, 409]);

  const loser = a.status() === 409 ? a : b;
  const body = await loser.json();
  expect(body.code).toBe("SLOT_TAKEN");
});

test("no se ofrece un horario en el que el servicio pisaría el turno siguiente", async ({
  request,
}) => {
  // El bug original: la verificación solo miraba si el *inicio* del slot caía
  // dentro de otro turno, así que un servicio de 60 min a las 10:00 se aceptaba
  // aunque hubiera un turno a las 10:30.
  const slot = await freeSlot(request);
  expect((await book(request, slot, "004")).status()).toBe(201);

  const longDuration = fixture.service.duration * 3;
  const slots = await getSlots(
    request,
    fixture.slug,
    fixture.staff.id,
    fixture.service.id,
    longDuration,
    fixture.date
  );

  const booked = new Date(slot).getTime();
  const overlapping = slots
    .filter((s) => {
      const start = new Date(s.time).getTime();
      return s.available && start < booked && start + longDuration * 60_000 > booked;
    })
    .map((s) => s.time);

  expect(overlapping, "se ofrecen horarios que terminarían encima del turno reservado").toEqual([]);
});

test("rechaza una reserva con un teléfono imposible", async ({ request }) => {
  const slot = await freeSlot(request);

  const response = await request.post("/api/appointments", {
    data: {
      serviceId: fixture.service.id,
      staffId: fixture.staff.id,
      dateTime: slot,
      guest: { name: "Prueba E2E", phone: "0000000000", email: "e2e@jikuapp.test" },
    },
  });

  expect(response.status(), "un teléfono imposible fue aceptado").toBe(400);
});

test("rechaza una reserva en un horario que no se ofrece", async ({ request }) => {
  // Las 4 de la mañana no están en ningún horario de trabajo del seed.
  const madrugada = `${fixture.date}T04:00:00.000Z`;

  const response = await request.post("/api/appointments", {
    data: {
      serviceId: fixture.service.id,
      staffId: fixture.staff.id,
      dateTime: madrugada,
      guest: testGuest("005"),
    },
  });

  expect([400, 409]).toContain(response.status());
});
