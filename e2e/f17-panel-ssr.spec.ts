import { test, expect } from "@playwright/test";
import { loginAsOwner } from "./helpers";

/**
 * The panel home renders its numbers on the server.
 *
 * It used to be a client component: skeleton first, then a fetch to
 * `/api/panel/stats`, then the numbers. This blocks that request to prove the
 * KPIs are already in the HTML — if they only appeared after the fetch, the
 * page would sit on its skeleton and the test would fail.
 */
test("el dashboard muestra sus números sin esperar al fetch del cliente", async ({ page }) => {
  await loginAsOwner(page);

  // La revalidación del cliente queda colgada a propósito.
  await page.route("**/api/panel/stats", () => {
    /* nunca responde */
  });

  await page.goto("/panel");

  await expect(page.getByText("Turnos hoy")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Ingresos del mes")).toBeVisible();
  await expect(page.getByText("Tasa de ocupación")).toBeVisible();

  // Y con un valor de verdad, no un guion de relleno.
  const occupancy = page.getByText(/^\d+%$/).first();
  await expect(occupancy).toBeVisible();
});

test("la tabla de turnos llega con sus filas desde el servidor", async ({ page }) => {
  await loginAsOwner(page);

  await page.route("**/api/panel/appointments**", () => {
    /* nunca responde */
  });

  await page.goto("/panel/turnos");

  await expect(page.getByRole("heading", { name: /gestión de turnos/i })).toBeVisible();
  // La cabecera de la tabla sólo se renderiza cuando hay datos.
  await expect(page.getByRole("table")).toBeVisible({ timeout: 15_000 });
});
