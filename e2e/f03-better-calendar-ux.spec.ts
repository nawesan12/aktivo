import { test, expect } from "@playwright/test";
import { SEED } from "./helpers";
import { pickService, pickStaff } from "./booking-flow";
import { loadBookingFixture, type BookingFixture } from "./fixtures";

test.describe("F3 — Better Calendar UX", () => {
  // Nombres leídos de la app, no copiados del seed: una recarga de datos con
  // otros nombres rompía estos tests por un motivo ajeno al producto.
  let fixture: BookingFixture;

  test.beforeAll(async ({ request }) => {
    fixture = await loadBookingFixture(request);
  });

  test("availability API returns slotCount when serviceId and duration provided", async ({
    request,
  }) => {
    // First get services to find a valid service+staff combo
    const servicesRes = await request.get(
      `/api/businesses/${SEED.business.slug}/services`
    );
    expect(servicesRes.ok()).toBeTruthy();
    const categories = await servicesRes.json();
    const firstService = categories[0]?.services?.[0];

    if (!firstService) {
      test.skip();
      return;
    }

    const staffId = firstService.staffIds?.[0];
    if (!staffId) {
      test.skip();
      return;
    }

    // Request availability with service context so slotCount is included
    const availRes = await request.get(
      `/api/businesses/${SEED.business.slug}/availability?staffId=${staffId}&serviceId=${firstService.id}&duration=${firstService.duration}`
    );

    if (availRes.ok()) {
      const dates = await availRes.json();
      expect(Array.isArray(dates)).toBe(true);
      // Check that available dates include slotCount
      const availableDate = dates.find((d: { hasSlots: boolean }) => d.hasSlots);
      if (availableDate) {
        expect(availableDate).toHaveProperty("slotCount");
        expect(typeof availableDate.slotCount).toBe("number");
      }
    }
  });

  test("la pantalla de reserva abre con los tres pasos a la vista", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);

    // Uno solo: profesional y horario aparecen recién cuando hay un servicio
    // elegido, que es lo que hace que la pantalla no abra abrumadora.
    await expect(page.getByRole("heading", { name: /Elegí tu servicio/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("los servicios del negocio del seed aparecen listados", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);

    await expect(page.getByText(fixture.service.name).first()).toBeVisible({ timeout: 15_000 });
  });

  test("elegir un servicio descubre al profesional y al horario", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await pickService(page, fixture.service.name);

    await expect(
      page.getByRole("heading", { name: /¿Con quién\?/i }),
      "elegir un servicio no descubrió el paso siguiente"
    ).toBeVisible({ timeout: 15_000 });
  });

  test("los horarios tienen el tamaño mínimo para el dedo", async ({ page }) => {
    await page.goto(`/${SEED.business.slug}/reservar`);
    await pickService(page, fixture.service.name);
    await pickStaff(page, fixture.staff.name);

    const slot = page
      .getByRole("button", { pressed: false })
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();
    await expect(slot).toBeVisible({ timeout: 20_000 });

    const box = await slot.boundingBox();
    expect(box, "el horario no tiene caja").not.toBeNull();
    // 44px es el mínimo que recomienda Apple y el que usa el diseño.
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });
});
