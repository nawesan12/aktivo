import { describe, it, expect } from "vitest";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * The manifest MercadoPago signs, and the way we check it.
 *
 * Kept as a unit test rather than only proving it against production, because
 * the failure mode is silent: a manifest that does not match rejects every real
 * notification with a 401, and nothing about the deploy looks wrong — payments
 * simply never confirm.
 */
function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

function verify(secret: string, dataId: string, requestId: string, ts: string, v1: string) {
  const expected = createHmac("sha256", secret)
    .update(`id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`)
    .digest();
  let received: Buffer;
  try {
    received = Buffer.from(v1, "hex");
  } catch {
    return false;
  }
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

const SECRET = "un-secreto-de-prueba";

describe("firma del webhook de MercadoPago", () => {
  it("acepta una notificación firmada con el secreto", () => {
    const v1 = sign(SECRET, "123456", "req-1", "1700000000");
    expect(verify(SECRET, "123456", "req-1", "1700000000", v1)).toBe(true);
  });

  it("rechaza la misma notificación con otro secreto", () => {
    const v1 = sign("otro-secreto", "123456", "req-1", "1700000000");
    expect(verify(SECRET, "123456", "req-1", "1700000000", v1)).toBe(false);
  });

  it("el id va en minúsculas, como pide la documentación", () => {
    // MercadoPago signs the lowercased id; signing the original casing produced
    // a manifest that never matched for alphanumeric ids.
    const firmadoEnMinusculas = sign(SECRET, "abc123", "req-1", "1700000000");
    expect(verify(SECRET, "ABC123", "req-1", "1700000000", firmadoEnMinusculas)).toBe(true);
  });

  it("cambiar el request id invalida la firma", () => {
    const v1 = sign(SECRET, "123456", "req-1", "1700000000");
    expect(verify(SECRET, "123456", "req-2", "1700000000", v1)).toBe(false);
  });

  it("una firma que no es hexadecimal no rompe nada", () => {
    expect(verify(SECRET, "123456", "req-1", "1700000000", "no-es-hex")).toBe(false);
  });
});
