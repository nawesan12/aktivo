import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { env } from "@/lib/env";

/**
 * Application-level encryption for secrets stored in the database.
 *
 * Each tenant's MercadoPago access token lives in `BusinessConfig.value`. In
 * plaintext, a leaked backup or any read access to the database would hand over
 * the payment credentials of every business on the platform.
 *
 * AES-256-GCM: authenticated, so a tampered ciphertext fails to decrypt instead
 * of silently returning garbage.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM standard
const PREFIX = "v1";

/**
 * 32-byte key derived from ENCRYPTION_KEY, or from AUTH_SECRET as a fallback so
 * existing deployments keep working. Domain-separated by hashing, so this key is
 * never the same bytes as the one signing sessions.
 *
 * Rotating the source secret makes stored values undecryptable — tokens have to
 * be re-entered by each business.
 */
let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const secret = env.ENCRYPTION_KEY || env.AUTH_SECRET;
  if (!secret) {
    throw new Error("ENCRYPTION_KEY (or AUTH_SECRET) must be set to store secrets");
  }

  cachedKey = createHash("sha256").update(`${secret}|jiku-config-encryption-v1`).digest();
  return cachedKey;
}

/** Encrypts a value for storage. Returns `v1:<iv>:<tag>:<ciphertext>`, base64. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);

  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypts a stored value.
 *
 * Values written before encryption existed are returned as-is: they are
 * recognisable because they don't carry the version prefix. This keeps already
 * configured businesses working; each token is encrypted the next time it is saved.
 */
export function decryptSecret(stored: string): string {
  if (!stored.startsWith(`${PREFIX}:`)) {
    return stored;
  }

  const parts = stored.split(":");
  const [, ivB64, tagB64, dataB64] = parts;
  // An empty string encrypts to an empty ciphertext, so check for presence of
  // the parts rather than truthiness — `!dataB64` would reject that valid case.
  if (parts.length !== 4 || !ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error("Malformed encrypted value");
  }

  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** True when a stored value is already encrypted. */
export function isEncrypted(stored: string): boolean {
  return stored.startsWith(`${PREFIX}:`);
}
