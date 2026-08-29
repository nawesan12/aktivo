import { describe, it, expect, beforeAll } from "vitest";
import { encryptSecret, decryptSecret, isEncrypted } from "../crypto";

const MP_TOKEN = "APP_USR-1234567890123456-031112-abcdef0123456789abcdef0123456789-1137276568";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = "test-key-for-unit-tests-only-not-a-real-secret";
});

describe("encryptSecret / decryptSecret", () => {
  it("recupera el valor original", () => {
    expect(decryptSecret(encryptSecret(MP_TOKEN))).toBe(MP_TOKEN);
  });

  it("el texto cifrado no contiene el original", () => {
    const encrypted = encryptSecret(MP_TOKEN);
    expect(encrypted).not.toContain(MP_TOKEN);
    expect(encrypted).not.toContain("APP_USR");
  });

  it("produce un texto distinto cada vez (IV aleatorio)", () => {
    expect(encryptSecret(MP_TOKEN)).not.toBe(encryptSecret(MP_TOKEN));
  });

  it("rechaza un valor alterado en vez de devolver basura", () => {
    const encrypted = encryptSecret(MP_TOKEN);
    const parts = encrypted.split(":");
    // Ensucia el ciphertext manteniendo el formato
    parts[3] = Buffer.from("otra-cosa-completamente-distinta").toString("base64");

    expect(() => decryptSecret(parts.join(":"))).toThrow();
  });

  it("maneja cadenas vacías y caracteres no ASCII", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("");
    expect(decryptSecret(encryptSecret("ñandú — 日本語"))).toBe("ñandú — 日本語");
  });
});

describe("compatibilidad con valores previos a la encriptación", () => {
  it("devuelve tal cual un valor guardado en texto plano", () => {
    // Tokens ya configurados por un negocio antes de este cambio
    expect(decryptSecret(MP_TOKEN)).toBe(MP_TOKEN);
  });

  it("distingue lo cifrado de lo que no lo está", () => {
    expect(isEncrypted(MP_TOKEN)).toBe(false);
    expect(isEncrypted(encryptSecret(MP_TOKEN))).toBe(true);
  });
});
