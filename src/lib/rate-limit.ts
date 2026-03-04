const windowMap = new Map<string, number[]>();

/**
 * In-memory sliding window rate limiter.
 * For production, consider @upstash/ratelimit with Redis.
 */
export function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): { success: boolean; remaining: number } {
  const now = Date.now();
  const timestamps = windowMap.get(key) ?? [];

  // Remove expired entries
  const valid = timestamps.filter((ts) => now - ts < windowMs);

  if (valid.length >= limit) {
    windowMap.set(key, valid);
    return { success: false, remaining: 0 };
  }

  valid.push(now);
  windowMap.set(key, valid);
  return { success: true, remaining: limit - valid.length };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
