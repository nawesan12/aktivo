import { test, expect, type Page } from "@playwright/test";

import { getSlots, loadBookingFixture, testGuest, type BookingFixture } from "./fixtures";
import { SEED, loginAsOwner } from "./helpers";

/**
 * El recorrido del cliente final: sacar un turno y poder volver a él.
 *
 * Era el hueco del producto. Existían dos carteras de turnos y ninguna se
 * alcanzaba: `/{negocio}/mis-turnos` sólo conocía invitados de ese local y los
 * buscaba por un teléfono que quien reservaba con sesión iniciada nunca había
 * dado, y `/mi-cuenta/turnos` estaba detrás de una cuenta que sólo podían
 * crear los dueños. La pantalla de turno confirmado no llevaba a ninguna.
 */

/**
 * Reserva por la API en vez de por la pantalla.
 *
 * El negocio del seed cobra seña, así que confirmar desde la interfaz sale a
 * MercadoPago y nunca llega a la confirmación — que es justamente la pantalla
 * que hay que mirar. La cookie de sesión que devuelve esta respuesta queda en
 * el contexto del navegador igual que si hubiera apretado el botón.
 */
async function reservar(page: Page, suffix: string) {
  const fixture: BookingFixture = await loadBookingFixture(page.request);
  const slots = await getSlots(
    page.request,
    fixture.slug,
    fixture.staff.id,
    fixture.service.id,
    fixture.service.duration,
    fixture.date
  );
  const free = slots.find((slot) => slot.available);
  expect(free, "el día elegido se quedó sin horarios libres").toBeTruthy();

  const guest = testGuest(suffix);
  const response = await page.request.post("/api/appointments", {
    data: {
      serviceId: fixture.service.id,
      staffId: fixture.staff.id,
      dateTime: free!.time,
      guest,
    },
  });
  expect(response.status(), await response.text()).toBe(201);

  return { fixture, guest, appointment: await response.json() };
}

/*
  Tres dígitos y nada más.

  `testGuest` pega el sufijo detrás de TEST_PHONE_PREFIX para armar el teléfono,
  así que cualquier letra ahí produce un número inválido y la reserva sale por
  400 — el prefijo son siete dígitos y un teléfono argentino son diez.
*/
let siguiente = 100;
function sufijo() {
  return String(siguiente++);
}

test.describe("F21 — la cartera de turnos del cliente", () => {
  test("reservar deja al cliente adentro, sin código ni contraseña", async ({ page }) => {
    const { fixture, guest, appointment } = await reservar(page, sufijo());

    // Reservar es la forma de identificarse. Sin esto, el único camino de
    // vuelta al turno recién sacado pasaba por escribir seis dígitos.
    const session = await page.request.get("/api/client/session");
    expect(session.ok()).toBeTruthy();
    expect((await session.json()).identified).toBe(true);

    await page.goto(`/${fixture.slug}/reservar/confirmacion?appointmentId=${appointment.id}`);
    await page.getByRole("link", { name: /Cambiar o cancelar/i }).click();
    await page.waitForURL("**/mis-turnos", { timeout: 20_000 });

    await expect(page.getByRole("heading", { name: "Mis turnos" })).toBeVisible();
    await expect(page.getByText("PRÓXIMO TURNO")).toBeVisible({ timeout: 20_000 });
    // Quién es, y cómo dejar de serlo: la sesión dura una semana y mucha gente
    // reserva desde un teléfono que después presta.
    await expect(page.getByText(guest.email)).toBeVisible();
    await expect(page.getByRole("button", { name: "Salir" })).toBeVisible();
  });

  test("la confirmación no es un callejón sin salida", async ({ page }) => {
    const { fixture, appointment } = await reservar(page, sufijo());
    await page.goto(`/${fixture.slug}/reservar/confirmacion?appointmentId=${appointment.id}`);

    // Antes había tres botones: agendar, reprogramar y compartir. Ninguno
    // llevaba de vuelta al local ni a ningún otro lado.
    await expect(page.getByRole("link", { name: /Cambiar o cancelar/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Volver a/i })).toBeVisible();
  });

  test("un link de confirmación sin turno tampoco deja a nadie encerrado", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar/confirmacion`);
    await expect(page.getByRole("link", { name: /Ver mis turnos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Volver al local/i })).toBeVisible();
  });

  test("el portal pide un email y no acusa al dato que escribiste", async ({ page, request }) => {
    await page.context().clearCookies();
    await page.goto("/mis-turnos");

    await expect(page.getByRole("heading", { name: "Tus turnos" })).toBeVisible();
    await expect(page.getByLabel(/email o tu teléfono/i)).toBeVisible();
    // Sin turnos todavía, la salida es explorar y no un callejón.
    await expect(page.getByRole("link", { name: /Explorá los locales/i })).toBeVisible();

    // El mensaje viejo era "No se encontraron turnos con este número", y salía
    // aunque el turno existiera: el portal sólo miraba invitados de un negocio.
    const res = await request.post("/api/client/auth/send-link", {
      data: { identifier: "nadie-en-absoluto@jikuapp.test" },
    });
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ sent: true, email: null });
  });

  test("un teléfono con turnos encuentra la casilla a la que mandar el link", async ({ page }) => {
    const { guest } = await reservar(page, sufijo());

    const res = await page.request.post("/api/client/auth/send-link", {
      data: { identifier: guest.phone },
    });
    expect(res.ok()).toBeTruthy();
    // Enmascarada: alcanza para saber qué casilla abrir sin publicar la
    // dirección a quien escribió el número.
    expect((await res.json()).email).toContain("***");
  });

  test("el portal del negocio redirige a la cartera de siempre", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/mis-turnos`);
    await page.waitForURL("**/mis-turnos", { timeout: 20_000 });
    expect(new URL(page.url()).pathname).toBe("/mis-turnos");
  });

  test("quien tiene cuenta entra derecho, sin que le pidan nada", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/mis-turnos");

    await expect(page.getByRole("heading", { name: "Mis turnos" })).toBeVisible();
    // Nada de formularios: el hueco original era justamente que a alguien con
    // sesión iniciada se le pedía un teléfono para llegar a sus propios turnos.
    await expect(page.getByLabel(/email o tu teléfono/i)).toBeHidden();
  });

  test("desde cualquier pantalla pública se llega a los turnos y al directorio", async ({
    page,
  }) => {
    for (const path of ["/explorar", `/${SEED.business.slug}`, "/mis-turnos"]) {
      await page.goto(path);
      await expect(
        page.getByRole("navigation", { name: "Principal" }).getByRole("link", {
          name: "Mis turnos",
        }),
        `${path} quedó sin salida hacia los turnos`
      ).toBeVisible();
    }
  });
});
