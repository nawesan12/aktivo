import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto";
import { appUrl, env } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("mercadopago:oauth");

const AUTHORIZE_URL = "https://auth.mercadopago.com/authorization";
const TOKEN_URL = "https://api.mercadopago.com/oauth/token";

/** Where MercadoPago sends the owner back. Must match the app's configuration exactly. */
export function oauthRedirectUri(): string {
  return appUrl("/api/mercadopago/oauth/callback");
}

function credentials() {
  const clientId = env.MP_CLIENT_ID;
  const clientSecret = env.MP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("MP_CLIENT_ID y MP_CLIENT_SECRET no están configurados");
  }

  return { clientId, clientSecret };
}

/** Whether linking accounts is available at all in this deployment. */
export function isOAuthConfigured(): boolean {
  return Boolean(env.MP_CLIENT_ID && env.MP_CLIENT_SECRET);
}

// ── The `state` parameter ───────────────────────────────────────────────────

/**
 * Signed, short-lived, and carrying the business it belongs to.
 *
 * MercadoPago hands this back untouched on the callback, which is the only
 * thing tying the returning browser to the business that started the flow. A
 * plain id would let anyone link their own MercadoPago account to somebody
 * else's business by editing a URL.
 */
let cachedKey: Uint8Array | null = null;

function stateKey(): Uint8Array {
  if (cachedKey) return cachedKey;

  const secret = env.AUTH_SECRET;
  cachedKey = new Uint8Array(
    createHash("sha256").update(`${secret}|jiku-mp-oauth-state-v1`).digest()
  );
  return cachedKey;
}

export async function signState(businessId: string, userId: string): Promise<string> {
  return new SignJWT({ businessId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(stateKey());
}

export async function verifyState(
  state: string
): Promise<{ businessId: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(state, stateKey());
    return {
      businessId: payload.businessId as string,
      userId: payload.userId as string,
    };
  } catch {
    return null;
  }
}

/** The URL the owner is sent to in order to authorise the link. */
export async function authorizationUrl(businessId: string, userId: string): Promise<string> {
  const { clientId } = credentials();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    platform_id: "mp",
    state: await signState(businessId, userId),
    redirect_uri: oauthRedirectUri(),
  });

  return `${AUTHORIZE_URL}?${params}`;
}

// ── Token exchange and renewal ──────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: number | string;
  public_key?: string;
  expires_in: number;
}

/**
 * Why MercadoPago refused, in a word the panel can act on.
 *
 * The raw message never leaves the server — it can name the credential that was
 * sent — but which of the two usual mistakes it was does need to reach the
 * owner, because both are fixed outside the app and neither is guessable from
 * "no se pudo conectar la cuenta".
 */
export type LinkFailure = "mismatch" | "self" | "failed";

export class MercadoPagoLinkError extends Error {
  constructor(
    message: string,
    readonly kind: LinkFailure
  ) {
    super(message);
    this.name = "MercadoPagoLinkError";
  }
}

/** Reads MercadoPago's own wording for the two mistakes we can name. */
function classify(status: number, detail: string): LinkFailure {
  const text = detail.toLowerCase();

  // The redirect URI configured on the application does not match the one the
  // authorisation was started with. MercadoPago is strict about this: it has to
  // be the callback, character for character.
  if (text.includes("redirect_uri") || text.includes("redirect uri")) return "mismatch";

  // Linking the account that owns the application to that same application.
  // MercadoPago refuses, and no amount of retrying changes it.
  if (
    text.includes("same user") ||
    text.includes("mismo usuario") ||
    text.includes("owner") ||
    text.includes("cannot be the collector")
  ) {
    return "self";
  }

  // `invalid_grant` on an authorisation code is almost always the redirect URI,
  // because the code itself is used once, immediately, by this route.
  if (status === 400 && text.includes("invalid_grant")) return "mismatch";

  return "failed";
}

async function requestToken(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    // The message is MercadoPago's own and safe to log: it names the failure
    // (invalid code, mismatched redirect) without carrying the credential.
    const detail = String(payload?.message ?? payload?.error ?? "sin detalle");
    throw new MercadoPagoLinkError(
      `MercadoPago rechazó la solicitud (${response.status}): ${detail}`,
      classify(response.status, detail)
    );
  }

  return payload as TokenResponse;
}

/** Stores a freshly issued pair, encrypted, against the business. */
async function persist(businessId: string, token: TokenResponse) {
  const expiresAt = new Date(Date.now() + token.expires_in * 1000);

  const data = {
    mpUserId: String(token.user_id),
    accessToken: encryptSecret(token.access_token),
    refreshToken: encryptSecret(token.refresh_token),
    publicKey: token.public_key ?? null,
    expiresAt,
    lastRefreshAt: new Date(),
    lastError: null,
  };

  await db.mercadoPagoAccount.upsert({
    where: { businessId },
    create: { businessId, ...data },
    update: data,
  });

  return expiresAt;
}

/** Exchanges the authorisation code for a linked account. */
export async function linkAccount(businessId: string, code: string): Promise<void> {
  const { clientId, clientSecret } = credentials();

  const token = await requestToken({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: oauthRedirectUri(),
  });

  const expiresAt = await persist(businessId, token);
  log.info("account linked", { businessId, mpUserId: String(token.user_id), expiresAt });
}

/**
 * Renews an account before it lapses.
 *
 * MercadoPago rotates the refresh token on every renewal, so both halves are
 * written back. Skipping that would work exactly once.
 */
export async function refreshAccount(businessId: string): Promise<void> {
  const account = await db.mercadoPagoAccount.findUnique({ where: { businessId } });
  if (!account) throw new Error("El negocio no tiene una cuenta vinculada");

  const { clientId, clientSecret } = credentials();

  try {
    const token = await requestToken({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: decryptSecret(account.refreshToken),
    });

    await persist(businessId, token);
    log.info("account renewed", { businessId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Recorded rather than swallowed: this is what the panel shows the owner and
    // what stops the job from retrying the same broken link forever in silence.
    await db.mercadoPagoAccount.update({
      where: { businessId },
      data: { lastError: message.slice(0, 500), lastRefreshAt: new Date() },
    });

    throw error;
  }
}

/** Removes the link. The tokens are dropped, not kept "just in case". */
export async function unlinkAccount(businessId: string): Promise<void> {
  await db.mercadoPagoAccount.deleteMany({ where: { businessId } });
  await db.businessConfig.deleteMany({
    where: { businessId, key: "mp_access_token" },
  });
}
