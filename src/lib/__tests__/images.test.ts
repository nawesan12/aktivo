import { describe, it, expect } from "vitest";
import { safeImageUrl } from "@/lib/images";

describe("imágenes subidas a Vercel Blob", () => {
  it("acepta el host del store, que es un subdominio por tienda", () => {
    expect(
      safeImageUrl("https://abc123.public.blob.vercel-storage.com/negocios/b1/logo/x.webp")
    ).toBe("https://abc123.public.blob.vercel-storage.com/negocios/b1/logo/x.webp");
  });

  it("no acepta un host que sólo se le parece", () => {
    // `endsWith` sin el punto inicial dejaría pasar
    // "evilpublic.blob.vercel-storage.com.attacker.com".
    expect(safeImageUrl("https://public.blob.vercel-storage.com.attacker.com/x.webp")).toBeNull();
    expect(safeImageUrl("https://blob.vercel-storage.com/x.webp")).toBeNull();
  });
});
