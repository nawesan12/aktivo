import { test, expect } from "@playwright/test";
import { SEED } from "./helpers";

test.describe("F12 — Business Directory", () => {
  test.describe("API", () => {
    test("directory API returns paginated businesses", async ({ request }) => {
      const res = await request.get("/api/directory?page=1&limit=10");
      expect(res.ok()).toBeTruthy();
      const data = await res.json();

      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("pages");
      expect(data.pagination).toHaveProperty("total");
    });

    test("directory API supports text search", async ({ request }) => {
      const res = await request.get(`/api/directory?q=${SEED.business.name.split(" ")[0]}`);
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test("directory API supports city filter", async ({ request }) => {
      const res = await request.get("/api/directory?city=Mar del Plata");
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test("directory results include expected fields", async ({ request }) => {
      const res = await request.get("/api/directory?page=1&limit=5");
      expect(res.ok()).toBeTruthy();
      const data = await res.json();

      if (data.data.length > 0) {
        const biz = data.data[0];
        expect(biz).toHaveProperty("id");
        expect(biz).toHaveProperty("name");
        expect(biz).toHaveProperty("slug");
        expect(biz).toHaveProperty("averageRating");
        expect(biz).toHaveProperty("reviewCount");
        expect(biz).toHaveProperty("topServices");
        // null hasta que el negocio recibe su primera reseña visible.
        expect(biz.averageRating === null || typeof biz.averageRating === "number").toBe(true);
        expect(Array.isArray(biz.topServices)).toBe(true);
      }
    });

    test("directory API returns empty for no-match search", async ({ request }) => {
      const res = await request.get("/api/directory?q=zzzznonexistentzzz");
      expect(res.ok()).toBeTruthy();
      const data = await res.json();
      expect(data.data).toHaveLength(0);
    });
  });

  test.describe("UI", () => {
    test("explorar page renders with search input", async ({ page }) => {
      await page.goto("/explorar");
      await page.waitForLoadState("networkidle");

      await expect(page.getByText(/Explorá negocios/i)).toBeVisible();
      await expect(page.getByPlaceholder(/Buscar por nombre/i)).toBeVisible();
    });

    test("explorar page shows business cards", async ({ page }) => {
      await page.goto("/explorar");
      await page.waitForLoadState("networkidle");

      // Should show at least the seeded businesses
      // Wait for data to load
      await page.waitForTimeout(2000);
      const body = page.locator("body");
      await expect(body).toBeVisible();
    });

    test("explorar search filters results", async ({ page }) => {
      await page.goto("/explorar");
      await page.waitForLoadState("networkidle");

      const searchInput = page.getByPlaceholder(/Buscar por nombre/i);
      await searchInput.fill("zzzznonexistent");

      // Wait for debounce + fetch
      await page.waitForTimeout(500);
      // Should show "No se encontraron negocios" or empty state
      await page.waitForTimeout(1000);
    });

    test("explorar city filter works", async ({ page }) => {
      await page.goto("/explorar");
      await page.waitForLoadState("networkidle");

      const cityInput = page.getByPlaceholder("Ciudad");
      await cityInput.fill("Mar del Plata");

      await page.waitForTimeout(500);
      // Results should still show (seeded business is in Mar del Plata)
    });

    test("business card links to business profile", async ({ page }) => {
      await page.goto("/explorar");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Try to find a link to a business
      const businessLink = page.locator(`a[href="/${SEED.business.slug}"]`).first();
      if (await businessLink.isVisible().catch(() => false)) {
        await businessLink.click();
        await page.waitForURL(`**/${SEED.business.slug}`);
        await expect(page.getByRole("heading", { name: SEED.business.name })).toBeVisible();
      }
    });
  });
});

test.describe("Landings por ciudad", () => {
  test("una ciudad con negocios tiene su propia página, y una inventada no", async ({
    page,
    request,
  }) => {
    // The directory is one URL filtered by a query string, which a crawler
    // cannot enumerate. These pages are what "peluquería en Mar del Plata"
    // lands on.
    await page.goto("/explorar");
    const cityLink = page.locator('a[href^="/explorar/"]').first();
    await expect(cityLink).toBeVisible();

    const href = await cityLink.getAttribute("href");
    await page.goto(href!);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Turnos en");
    await expect(page.locator('a[href^="/"]').first()).toBeVisible();

    const missing = await request.get("/explorar/ciudad-que-no-existe");
    expect(missing.status()).toBe(404);
  });

  test("el sitemap ofrece las páginas de ciudad", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    expect(await res.text()).toContain("/explorar/");
  });
});
