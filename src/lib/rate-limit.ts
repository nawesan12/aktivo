/**
 * Rate limiting with a shared backend when one is configured.
 *
 * The in-memory fallback only counts requests hitting *this* process. On Vercel
 * every serverless instance keeps its own map, so the effective limit is a
 * multiple of the declared one — fine for local development, not a real defence.
 * Set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN to make limits global.
 */

import { redisCredentials } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

export interface RateLimitResult {
  success: boolean;
  remaining: number;
}

const redis = redisCredentials();
const REDIS_URL = redis?.url;
const REDIS_TOKEN = redis?.token;
const usingRedis = Boolean(redis);

let warnedAboutMemory = false;

// ── In-memory fallback ──────────────────────────────────────────────────────

const windowMap = new Map<string, number[]>();

function rateLimitInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const valid = (windowMap.get(key) ?? []).filter((ts) => now - ts < windowMs);

  if (valid.length >= limit) {
    windowMap.set(key, valid);
    return { success: false, remaining: 0 };
  }

  valid.push(now);
  windowMap.set(key, valid);
  return { success: true, remaining: limit - valid.length };
}

/** Reads the current count without spending an attempt. */
function peekInMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const valid = (windowMap.get(key) ?? []).filter((ts) => now - ts < windowMs);
  return { success: valid.length < limit, remaining: Math.max(0, limit - valid.length) };
}

// ── Upstash Redis (REST, no extra dependency) ───────────────────────────────

/**
 * Fixed window via INCR + EXPIRE. Less precise than a sliding window at the
 * edges, but atomic across instances, which is the property that matters.
 */
async function rateLimitInRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  // Bucket the key by window so counters reset without a separate cleanup.
  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `ratelimit:${key}:${bucket}`;

  const response = await fetch(`${REDIS_URL}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, String(windowSeconds)],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash responded ${response.status}`);
  }

  const results = (await response.json()) as { result: number }[];
  const count = Number(results[0]?.result ?? 0);

  return { success: count <= limit, remaining: Math.max(0, limit - count) };
}

/** Reads the counter without incrementing it. */
async function peekInRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const bucket = Math.floor(Date.now() / windowMs);
  const redisKey = `ratelimit:${key}:${bucket}`;

  const response = await fetch(`${REDIS_URL}/get/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash responded ${response.status}`);
  }

  const body = (await response.json()) as { result: string | null };
  const count = Number(body.result ?? 0);

  return { success: count < limit, remaining: Math.max(0, limit - count) };
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (usingRedis) {
    try {
      return await rateLimitInRedis(key, limit, windowMs);
    } catch (error) {
      // Never let a limiter outage take the endpoint down with it.
      log.error("Redis unavailable, falling back to in-memory counters", error);
      return rateLimitInMemory(key, limit, windowMs);
    }
  }

  if (!warnedAboutMemory && process.env.NODE_ENV === "production") {
    warnedAboutMemory = true;
    log.warn("no Redis configured — limits are per-instance and easily exceeded");
  }

  return rateLimitInMemory(key, limit, windowMs);
}

/**
 * Checks a limit without consuming an attempt.
 *
 * Sign-in needs this: a successful login must not count against the budget.
 * Charging every attempt meant a legitimate user signing in from a second
 * device, or after a session expired, could lock themselves out — while a brute
 * force attempt, which is all failures, was no more constrained. The budget
 * belongs to the failures.
 */
export async function peekRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  if (usingRedis) {
    try {
      return await peekInRedis(key, limit, windowMs);
    } catch (error) {
      log.error("Redis unavailable, falling back to in-memory counters", error);
      return peekInMemory(key, limit, windowMs);
    }
  }

  return peekInMemory(key, limit, windowMs);
}

/**
 * Client IP for rate limiting.
 *
 * `x-forwarded-for` is client-controlled unless a proxy overwrites it. On Vercel
 * it is rewritten by the platform, and `x-vercel-forwarded-for` is set by the
 * edge network, so it is preferred when present. Outside Vercel, deploy behind a
 * proxy that sanitises these headers — otherwise every limit here is bypassable
 * by rotating the header.
 */
export function getClientIP(request: Request): string {
  const vercelIP = request.headers.get("x-vercel-forwarded-for");
  if (vercelIP) return vercelIP.split(",")[0].trim();

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return "unknown";
}
