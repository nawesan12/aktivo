import { createHash } from "crypto";
import { sendAccessLinkEmail } from "@/lib/notifications/access-link-email";
import { SignJWT, jwtVerify } from "jose";
import { appUrl, env } from "@/lib/env";

/**
 * Getting into your appointments, without typing anything.
 *
 * There is no six-digit code any more. Booking hands the browser a session
 * outright, and coming back from another device means opening one link from
 * one email. Nothing here asks a person to transcribe a number.
 */

/**
 * Signing key for customer session tokens.
 *
 * Resolved lazily and never falls back to a literal: a hardcoded default would
 * let anyone forge a token for anybody. `GUEST_JWT_SECRET` is preferred —
 * named before this stopped being only about guests, and left alone because it
 * is configured in production; `AUTH_SECRET` is accepted so the app keeps
 * working where only that one is set. Either is domain-separated by hashing,
 * so a customer token can never be confused with a NextAuth session token.
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

/**
 * Mails somebody a way back into their appointments.
 *
 * A link and nothing else. Six digits meant leaving the browser, opening the
 * mail app, memorising a number, coming back and typing it — for a haircut. A
 * phone number typed into the portal is only ever a way of finding the address
 * this goes to.
 */
export async function sendAccessLink(email: string, name?: string): Promise<void> {
  const token = await createAccessLink(email, name);
  await sendAccessLinkEmail(
    email,
    appUrl(`/api/client/auth/link?t=${encodeURIComponent(token)}`)
  );
}

/**
 * Session for a customer, carrying their address and how much we trust it.
 *
 * `verified` is the difference between having proved you read the inbox — you
 * opened the link we mailed there — and merely having typed the address into a
 * booking form. Both let you manage what you booked; only the verified one is
 * allowed to resolve an account, so writing somebody else's address into a
 * booking can never hand over the appointments of a registered customer.
 *
 * What that address can see is read from the database on each request, so an
 * appointment booked after the token was issued shows up without signing in
 * again, and a guest row that gets merged or deleted stops being reachable.
 */
export async function createClientToken(
  email: string,
  options: { name?: string; verified: boolean }
): Promise<string> {
  return new SignJWT({
    email: email.trim().toLowerCase(),
    name: options.name,
    verified: options.verified,
    kind: "session",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyClientToken(
  token: string
): Promise<{ email: string; name?: string; verified: boolean } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    // A one-tap link token is signed with the same key and must not be usable
    // as a week-long session on its own.
    if (payload.kind !== "session") return null;
    const email = payload.email;
    if (typeof email !== "string" || !email) return null;
    return {
      email,
      name: typeof payload.name === "string" ? payload.name : undefined,
      verified: payload.verified === true,
    };
  } catch {
    return null;
  }
}

/**
 * The token inside the emailed link.
 *
 * Short-lived and separate from the session it produces: a link that sat in an
 * inbox for a month should not still open somebody's appointments, but the week
 * of access it grants when used starts from the tap.
 */
export async function createAccessLink(email: string, name?: string): Promise<string> {
  return new SignJWT({ email: email.trim().toLowerCase(), name, kind: "link" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(getJwtSecret());
}

export async function verifyAccessLink(
  token: string
): Promise<{ email: string; name?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (payload.kind !== "link") return null;
    const email = payload.email;
    if (typeof email !== "string" || !email) return null;
    return { email, name: typeof payload.name === "string" ? payload.name : undefined };
  } catch {
    return null;
  }
}
