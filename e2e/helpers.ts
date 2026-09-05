import { type Page, expect } from "@playwright/test";

/** Seed data constants matching prisma/seed.ts */
export const SEED = {
  business: {
    slug: "el-corte",
    name: "El Corte Barberia",
  },
  owner: {
    email: "owner@elcorte.com",
    password: "owner123",
  },
  admin: {
    email: "admin@jiku.app",
    password: "admin123",
  },
  guest: {
    name: "Juan Perez",
    phone: "5492234999888",
  },
  services: {
    corteClasico: "Corte Clasico",
    cortePremium: "Corte Premium",
    comboCorteBarba: "Combo Corte + Barba",
  },
  staff: {
    martin: "Martin Lopez",
    diego: "Diego Fernandez",
  },
};

/** Log in as a user via the login page */
export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/iniciar-sesion");
  // By label, not by placeholder: the password field's placeholder is "********".
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole("button", { name: /iniciar sesión|ingresar|entrar al panel/i }).click();
  // Wait for redirect
  await page.waitForURL((url) => !url.pathname.includes("iniciar-sesion"), {
    timeout: 15_000,
  });
}

/** Navigate to the business booking page */
export async function goToBooking(page: Page, slug = SEED.business.slug) {
  await page.goto(`/${slug}/reservar`);
  await page.waitForLoadState("networkidle");
}

/** Navigate to business profile */
export async function goToProfile(page: Page, slug = SEED.business.slug) {
  await page.goto(`/${slug}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Navigate to the customer's appointments.
 *
 * One address for everybody now: the per-shop portal redirects here, and the
 * page decides between a session, a verified code and the form on its own.
 */
export async function goToMisTurnos(page: Page) {
  await page.goto("/mis-turnos");
  await page.waitForLoadState("networkidle");
}

/** Login as owner and navigate to panel */
export async function loginAsOwner(page: Page) {
  await loginAs(page, SEED.owner.email, SEED.owner.password);
}

/** Wait for and assert a toast notification */
export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").first();
  await expect(toast).toContainText(text, { timeout: 10_000 });
}

/** Helper: call an API route and return JSON */
export async function apiCall(
  page: Page,
  method: string,
  url: string,
  body?: Record<string, unknown>
) {
  const response = await page.request[method.toLowerCase() as "get" | "post" | "put" | "patch" | "delete"](
    url,
    body ? { data: body } : undefined
  );
  return { status: response.status(), data: await response.json() };
}
