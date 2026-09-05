import type { APIRequestContext } from "@playwright/test";

/**
 * Test data discovered through the public API instead of hardcoded.
 *
 * `helpers.ts` carried a copy of the seed — service names, staff names — so any
 * reseed with different data broke the suite for reasons unrelated to the
 * product, and the tests were loosened until they only checked that pages did
 * not crash. Reading the real ids also keeps these runnable against a deployed
 * environment, where there is no seed at all.
 */

export interface BookingFixture {
  slug: string;
  service: { id: string; name: string; duration: number };
  staff: { id: string; name: string };
  /** A date the member of staff actually works and has free slots on. */
  date: string;
  slots: Slot[];
}

export interface Slot {
  time: string;
  available: boolean;
}

/**
 * `no-store` matters: several tests read availability, book, and read again.
 * Without it the request context can serve the second, identical GET from cache
 * and the test sees the slot as still free — a failure that is entirely the
 * test's own.
 */
async function json(request: APIRequestContext, url: string) {
  const response = await request.get(url, {
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
  if (!response.ok()) {
    throw new Error(`GET ${url} → ${response.status()} ${await response.text()}`);
  }
  return response.json();
}

interface ServiceOrCategory {
  id: string;
  name: string;
  duration?: number;
  services?: { id: string; name: string; duration: number }[];
}

function flattenServices(
  entries: ServiceOrCategory[]
): { id: string; name: string; duration: number }[] {
  return entries.flatMap((entry) =>
    entry.services?.length
      ? entry.services
      : typeof entry.duration === "number"
        ? [{ id: entry.id, name: entry.name, duration: entry.duration }]
        : []
  );
}

function unwrap<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const record = payload as { data?: T[]; slots?: T[] };
  return record.data ?? record.slots ?? [];
}

export async function listedBusinesses(request: APIRequestContext): Promise<string[]> {
  const directory = await json(request, "/api/directory?page=1&limit=20");
  const businesses = unwrap<{ slug: string }>(directory);
  if (businesses.length === 0) {
    throw new Error("El directorio está vacío. Ejecutá `npm run db:seed`.");
  }
  return businesses.map((b) => b.slug);
}

export async function getSlots(
  request: APIRequestContext,
  slug: string,
  staffId: string,
  serviceId: string,
  duration: number,
  date: string
): Promise<Slot[]> {
  const payload = await json(
    request,
    `/api/businesses/${slug}/availability/slots` +
      `?staffId=${staffId}&date=${date}&serviceId=${serviceId}&duration=${duration}`
  );
  return unwrap<Slot>(payload);
}

/**
 * Finds a business, a service, a member of staff and a day with free slots.
 * Days are probed from `daysAhead` so the minimum-notice rule cannot interfere.
 */
export async function loadBookingFixture(
  request: APIRequestContext,
  { daysAhead = 2, searchDays = 14 } = {}
): Promise<BookingFixture> {
  const reasons: string[] = [];

  for (const slug of await listedBusinesses(request)) {
    // The endpoint returns categories with their services nested, plus any
    // uncategorised services at the top level.
    const services = flattenServices(
      unwrap<ServiceOrCategory>(await json(request, `/api/businesses/${slug}/services`))
    );
    if (services.length === 0) {
      reasons.push(`${slug}: sin servicios activos`);
      continue;
    }
    const service = services[0];

    const staffList = unwrap<{ id: string; name: string }>(
      await json(request, `/api/businesses/${slug}/staff?serviceId=${service.id}`)
    );
    if (staffList.length === 0) {
      reasons.push(`${slug}: sin personal activo`);
      continue;
    }
    const staff = staffList[0];

    for (let offset = daysAhead; offset < daysAhead + searchDays; offset++) {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      const date = day.toISOString().slice(0, 10);

      const slots = await getSlots(request, slug, staff.id, service.id, service.duration, date);
      if (slots.some((s) => s.available)) {
        return { slug, service, staff, date, slots };
      }
    }

    reasons.push(`${slug}: sin horarios libres en ${searchDays} días`);
  }

  throw new Error(`Ningún negocio del directorio permite reservar:\n  ${reasons.join("\n  ")}`);
}

/** Phone numbers used by the suite, so cleanup can find exactly these. */
export const TEST_PHONE_PREFIX = "2234999";

/**
 * Slug prefix for the businesses the suite registers, so cleanup finds those
 * and only those. A test that signs up leaves a shop in the directory —
 * visible on the public listing and in the sitemap — until something removes
 * it, which is exactly how six "Barberia Prueba" ended up being the whole
 * directory once.
 */
export const TEST_BUSINESS_PREFIX = "prueba-e2e-";

export function testGuest(suffix: string) {
  return {
    name: "Prueba E2E",
    phone: `${TEST_PHONE_PREFIX}${suffix}`,
    // Required since email became the only notification channel: a booking
    // without one reaches nobody.
    email: `e2e-${suffix}@jikuapp.test`,
  };
}
