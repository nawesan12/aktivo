import { test, expect, type Page, type Locator } from "@playwright/test";
import { SEED, loginAs } from "./helpers";
import { TEST_PHONE_PREFIX } from "./fixtures";
import { addDays, format } from "date-fns";

/**
 * The panel taking a booking itself.
 *
 * Until this existed the agenda was read-only: every turno had to come through
 * the public page, so a shop answering the phone had to open its own website
 * and book as if it were the customer.
 *
 * El modal pregunta en el orden de la conversación real —qué, cuándo, para
 * quién— y cada paso aparece cuando el anterior está resuelto, así que el test
 * lo recorre en ese orden. Antes empezaba por los datos del cliente, con el
 * servicio más abajo: se llenaba la ficha de la persona antes de saber si
 * quedaba lugar.
 */

/** Servicio → profesional → fecha, hasta que la grilla muestra horarios. */
async function elegirTurno(dialog: Locator, day: string) {
  await dialog.getByRole("button", { name: SEED.services.corteClasico }).click();

  // Un profesional con nombre y no "quien esté libre": con dos en el equipo el
  // horario le queda libre al otro, que es correcto y volvería inútil la
  // comprobación del final.
  await dialog.getByLabel("Profesional").selectOption({ label: SEED.staff.martin });
  await dialog.getByLabel("Fecha").fill(day);

  const slot = dialog.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
  await expect(slot).toBeVisible({ timeout: 20_000 });
  return slot;
}

test.describe("F19 — cargar un turno desde el panel", () => {
  test("el dueño agenda a alguien que llamó por teléfono", async ({ page }: { page: Page }) => {
    test.setTimeout(90_000);

    await loginAs(page, SEED.owner.email, SEED.owner.password);
    await page.goto("/panel/turnos");

    await page.getByRole("button", { name: "Cargar un turno" }).click();

    const dialog = page.getByRole("dialog", { name: "Cargar un turno" });
    await expect(dialog).toBeVisible();

    // Unos días adelante, para que los horarios del seed lo cubran seguro.
    const day = format(addDays(new Date(), 3), "yyyy-MM-dd");
    const slot = await elegirTurno(dialog, day);
    const chosenTime = (await slot.textContent())!.trim();
    await slot.click();

    // El cliente recién ahora: hasta que no hay horario elegido, este paso no
    // existe.
    const stamp = String(Date.now()).slice(-4);
    const clientName = `Llamo ${stamp}`;
    await dialog.getByRole("button", { name: /cliente nuevo/i }).click();
    await dialog.getByLabel("Nombre del cliente nuevo").fill(clientName);
    // Un número distinto por corrida: uno que ya exista engancha el turno al
    // cliente que lo tiene y conserva su nombre —que es lo correcto— y dejaría
    // la comprobación de abajo midiendo nada.
    await dialog.getByLabel("Teléfono del cliente nuevo").fill(`${TEST_PHONE_PREFIX}${stamp}`);

    await dialog.getByRole("button", { name: "Cargar turno" }).click();

    // It lands in the agenda, under the name the owner typed. Searched for
    // rather than eyeballed on page one: a busy agenda pages at twenty.
    await page.getByPlaceholder("Buscar por cliente...").fill(clientName);
    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 20_000 });

    // And the slot it took is no longer on offer: the panel books against the
    // same availability and the same database constraint as the public page.
    await page.getByRole("button", { name: "Cargar un turno" }).click();
    await elegirTurno(dialog, day);
    await expect(
      dialog.locator("button").filter({ hasText: new RegExp(`^${chosenTime}$`) })
    ).toHaveCount(0);
  });

  test("no pide los datos del cliente antes de saber si hay lugar", async ({ page }) => {
    await loginAs(page, SEED.owner.email, SEED.owner.password);
    await page.goto("/panel/turnos");
    await page.getByRole("button", { name: "Cargar un turno" }).click();

    const dialog = page.getByRole("dialog", { name: "Cargar un turno" });
    await expect(dialog.getByText("¿Qué se hace?")).toBeVisible();
    // Abre con una sola pregunta: el resto llega cuando hay algo elegido.
    await expect(dialog.getByText("¿Cuándo?")).toBeHidden();
    await expect(dialog.getByText("¿Para quién?")).toBeHidden();

    await dialog.getByRole("button", { name: SEED.services.corteClasico }).click();
    await expect(dialog.getByText("¿Cuándo?")).toBeVisible();
    await expect(dialog.getByText("¿Para quién?")).toBeHidden();
  });
});
