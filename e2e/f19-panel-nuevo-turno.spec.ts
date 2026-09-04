import { test, expect } from "@playwright/test";
import { SEED, loginAs } from "./helpers";
import { TEST_PHONE_PREFIX } from "./fixtures";
import { addDays, format } from "date-fns";

/**
 * The panel taking a booking itself.
 *
 * Until this existed the agenda was read-only: every turno had to come through
 * the public page, so a shop answering the phone had to open its own website
 * and book as if it were the customer.
 */
test.describe("F19 — cargar un turno desde el panel", () => {
  test("el dueño agenda a alguien que llamó por teléfono", async ({ page }) => {
    test.setTimeout(90_000);

    await loginAs(page, SEED.owner.email, SEED.owner.password);
    await page.goto("/panel/turnos");

    await page.getByRole("button", { name: "Cargar un turno" }).click();

    const dialog = page.getByRole("dialog", { name: "Cargar un turno" });
    await expect(dialog).toBeVisible();

    // A fresh number each run: an existing phone attaches the turno to the
    // client who already owns it and keeps their name, which is the right
    // behaviour and would make this assertion measure nothing.
    const stamp = String(Date.now()).slice(-4);
    const clientName = `Llamo ${stamp}`;
    await dialog.getByLabel("Nombre del cliente nuevo").fill(clientName);
    await dialog.getByLabel("Teléfono del cliente nuevo").fill(`${TEST_PHONE_PREFIX}${stamp}`);

    await dialog.getByLabel("Servicio").selectOption({ label: SEED.services.corteClasico });
    // A named professional, not "quien esté libre": with two on the roster the
    // slot stays on offer for the other one, which is correct and would make
    // the check below meaningless.
    await dialog.getByLabel("Profesional").selectOption({ label: SEED.staff.martin });

    // A few days out, so the seed's working hours definitely cover it.
    const day = format(addDays(new Date(), 3), "yyyy-MM-dd");
    await dialog.getByLabel("Fecha").fill(day);

    // The first free time on offer, whatever it is.
    const slot = dialog.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first();
    await expect(slot).toBeVisible({ timeout: 20_000 });
    const chosenTime = (await slot.textContent())!.trim();
    await slot.click();

    await dialog.getByRole("button", { name: "Cargar turno" }).click();

    // It lands in the agenda, under the name the owner typed. Searched for
    // rather than eyeballed on page one: a busy agenda pages at twenty.
    await page.getByPlaceholder("Buscar por cliente...").fill(clientName);
    await expect(page.getByText(clientName).first()).toBeVisible({ timeout: 20_000 });

    // And the slot it took is no longer on offer: the panel books against the
    // same availability and the same database constraint as the public page.
    await page.getByRole("button", { name: "Cargar un turno" }).click();
    await dialog.getByLabel("Servicio").selectOption({ label: SEED.services.corteClasico });
    await dialog.getByLabel("Profesional").selectOption({ label: SEED.staff.martin });
    await dialog.getByLabel("Fecha").fill(day);
    await expect(dialog.locator("button").filter({ hasText: /^\d{2}:\d{2}$/ }).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      dialog.locator("button").filter({ hasText: new RegExp(`^${chosenTime}$`) })
    ).toHaveCount(0);
  });
});
