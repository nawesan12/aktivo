import { describe, it, expect } from "vitest";
import { z } from "zod";
import { handleApiError } from "@/lib/api-errors";

describe("handleApiError with a schema error", () => {
  it("answers 400 with the field's own message, not a 500", async () => {
    const schema = z.object({ slug: z.string().min(3, "Mínimo 3 caracteres") });
    let thrown: unknown;
    try {
      schema.parse({ slug: "ab" });
    } catch (error) {
      thrown = error;
    }

    const response = handleApiError(thrown);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Mínimo 3 caracteres",
      code: "VALIDATION",
    });
  });
});
