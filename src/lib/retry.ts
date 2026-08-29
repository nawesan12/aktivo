import { createLogger, type LogContext } from "@/lib/logger";

const log = createLogger("retry");

export interface RetryOptions {
  /** Total attempts, including the first one. */
  attempts?: number;
  /** Delay before the second attempt; doubles from there. */
  baseDelayMs?: number;
  /** Named for the log line: "whatsapp:send". */
  scope?: string;
  context?: LogContext;
  /** Return false to give up immediately — a 400 will not fix itself. */
  shouldRetry?: (error: unknown) => boolean;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries with exponential backoff and jitter.
 *
 * Meta's API and Resend both fail transiently often enough that a single
 * attempt loses real messages: a booking confirmation that never arrives is a
 * customer who shows up at the wrong time.
 *
 * Jitter matters here because reminders go out in batches from a cron: without
 * it, every failure in the batch retries at exactly the same moment.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts = 3,
    baseDelayMs = 300,
    scope = "operation",
    context,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === attempts || !shouldRetry(error)) break;

      const backoff = baseDelayMs * 2 ** (attempt - 1);
      const delay = backoff + Math.random() * backoff * 0.3;
      log.warn("attempt failed, retrying", {
        scope,
        attempt,
        of: attempts,
        inMs: Math.round(delay),
        ...context,
      });
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry on network failures and on the server-side / throttling responses.
 * A 4xx other than 429 means the request itself is wrong: repeating it only
 * wastes the remaining attempts.
 */
function defaultShouldRetry(error: unknown): boolean {
  if (!(error instanceof Error)) return true;

  const status = (error as { status?: number }).status;
  if (typeof status === "number") {
    return status === 429 || status >= 500;
  }

  const match = error.message.match(/HTTP (\d{3})/);
  if (match) {
    const code = Number(match[1]);
    return code === 429 || code >= 500;
  }

  return true;
}
