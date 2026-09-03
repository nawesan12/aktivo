import { createHash, randomInt, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/notifications/verification-email";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import { phoneLookupVariants } from "@/lib/phone";

/** Wrong codes accepted for a single verification before it is burned. */
const MAX_VERIFICATION_ATTEMPTS = 5;

const CODE_TTL_MS = 10 * 60 * 1000;

/**
 * Signing key for guest session tokens.
 *
 * Resolved lazily and never falls back to a literal: a hardcoded default would
 * let anyone forge a token for any guest of any business. `GUEST_JWT_SECRET` is
 * preferred; `AUTH_SECRET` is accepted so the app keeps working where only that
 * one is configured, but it is domain-separated by hashing, so a guest token can
 * never be confused with a NextAuth session token.
 */
let cachedSecret: Uint8Array | null = null;

function getJwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;

  const secret = env.GUEST_JWT_SECRET || env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "GUEST_JWT_SECRET (or AUTH_SECRET) must be set to sign guest tokens"
    );
  }

  cachedSecret = new Uint8Array(
    createHash("sha256").update(`${secret}|jiku-guest-token-v1`).digest()
  );
  return cachedSecret;
}

/** Six-digit verification code, from a cryptographically secure source. */
export function generateCode(): string {
  return randomInt(100000, 1000000).toString();
}

/** Constant-time comparison, so a wrong code leaks nothing through timing. */
function codesMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Delivers the code to the guest's email.
 *
 * The flow is still keyed by phone — that is what identifies a guest inside a
 * business — but email is the only channel the product has, so a guest client
 * without one cannot be verified at all. Every booking made from now on
 * requires an email; only legacy rows can hit this.
 */
export async function sendVerificationCode(
  email: string,
  code: string,
  businessName: string
): Promise<void> {
  await sendVerificationEmail(email, code, businessName);
}

export async function createVerification(phone: string, code: string): Promise<void> {
  // Delete old codes for this phone
  await db.guestVerification.deleteMany({ where: { phone } });

  await db.guestVerification.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
}

export async function verifyCode(
  phone: string,
  code: string,
  businessId: string
): Promise<{ guestClientId: string } | null> {
  // Looked up by phone alone (not phone+code) so that failed attempts can be
  // counted; otherwise a wrong guess is indistinguishable from no code at all
  // and brute force is unbounded.
  const verification = await db.guestVerification.findFirst({
    where: { phone, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!verification) return null;

  if (verification.attempts >= MAX_VERIFICATION_ATTEMPTS) {
    await db.guestVerification.delete({ where: { id: verification.id } });
    return null;
  }

  if (!codesMatch(verification.code, code)) {
    await db.guestVerification.update({
      where: { id: verification.id },
      data: { attempts: { increment: 1 } },
    });
    return null;
  }

  // Delete used verification
  await db.guestVerification.delete({ where: { id: verification.id } });

  // Find the guest client for this business
  const guestClient = await db.guestClient.findFirst({
    where: { businessId, phone: { in: phoneLookupVariants(phone) } },
  });

  if (!guestClient) return null;

  return { guestClientId: guestClient.id };
}

export async function createGuestToken(
  guestClientId: string,
  businessId: string
): Promise<string> {
  return new SignJWT({ guestClientId, businessId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyGuestToken(
  token: string
): Promise<{ guestClientId: string; businessId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      guestClientId: payload.guestClientId as string,
      businessId: payload.businessId as string,
    };
  } catch {
    return null;
  }
}
