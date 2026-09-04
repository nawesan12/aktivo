import { expect, type Page } from "@playwright/test";

import type { BookingFixture } from "./fixtures";

/**
 * Walking the booking screen.
 *
 * The five-step wizard is gone — service, professional and time are all on one
 * page now — so the specs that used to press "continuar" between steps share
 * these instead. Everything is addressed by role and accessible name, which is
 * also what keeps the screen usable with a keyboard.
 */

export async function pickService(page: Page, name: string) {
  const card = page.getByRole("button", { name: new RegExp(escape(name), "i") }).first();
  await expect(card, `no apareció el servicio ${name}`).toBeVisible({ timeout: 15_000 });
  await card.click();
  await expect(card).toHaveAttribute("aria-pressed", "true");
}

export async function pickStaff(page: Page, name: string) {
  const chip = page.getByRole("button", { name: new RegExp(escape(name), "i") }).first();
  await expect(chip, `no apareció el profesional ${name}`).toBeVisible({ timeout: 15_000 });
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
}

/** The first day in the strip that has anything free, and its first free slot. */
export async function pickFirstSlot(page: Page) {
  // `disabled: false` matters: a taken slot is rendered struck-through and
  // disabled rather than removed, and it is often the first of the day.
  const free = page
    .getByRole("button", { pressed: false, disabled: false })
    .filter({ hasText: /^\d{2}:\d{2}$/ })
    .first();

  await expect(free, "el día elegido no ofrece horarios libres").toBeVisible({ timeout: 20_000 });
  // Read the time before clicking: `pressed: false` stops matching the moment
  // it is chosen, so the same locator would slide onto the next free slot.
  const time = (await free.textContent())?.trim() ?? "";
  await free.click();

  const chosen = page.getByRole("button", { name: time, exact: true });
  await expect(chosen, "el horario no quedó elegido").toHaveAttribute("aria-pressed", "true");
  return time;
}

export async function fillGuest(
  page: Page,
  guest: { name: string; phone: string; email: string }
) {
  await page.getByLabel("Tu nombre", { exact: true }).first().fill(guest.name);
  await page.getByLabel("Tu teléfono", { exact: true }).first().fill(guest.phone);
  await page.getByLabel("Tu email", { exact: true }).first().fill(guest.email);
}

/** Service → professional → slot, ready to confirm. */
export async function bookUpToSlot(page: Page, fixture: BookingFixture) {
  await page.goto(`/${fixture.slug}/reservar`);
  await pickService(page, fixture.service.name);
  await pickStaff(page, fixture.staff.name);
  await pickFirstSlot(page);
}

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
