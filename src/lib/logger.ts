/**
 * Structured logging.
 *
 * Before this, the only mechanism was ~96 scattered `console.*` calls with four
 * different prefix conventions and free-form interpolated strings. On Vercel
 * those land as unindexed text: there is no way to filter by business, by
 * appointment, or to count how many WhatsApp sends failed last night.
 *
 * In production each entry is a single JSON line, which log aggregators parse
 * natively. In development it stays human-readable, because a wall of JSON
 * while coding is worse than the strings we had.
 *
 * Intentionally dependency-free: it is imported by webhooks, crons and the
 * database layer, and it must never be the thing that breaks a request.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

/** Structured fields attached to an entry. Never put secrets here. */
export type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function minimumLevel(): LogLevel {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  if (configured && configured in LEVEL_ORDER) return configured;
  if (process.env.NODE_ENV === "test") return "error";
  if (process.env.NODE_ENV === "production") return "info";
  return "debug";
}

/**
 * Errors do not survive `JSON.stringify` — it produces `{}`. Serialising them
 * by hand is the difference between a usable log line and a useless one.
 */
function serialiseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const out: Record<string, unknown> = {
      name: error.name,
      message: error.message,
    };
    if (error.stack) out.stack = error.stack;
    if (error.cause) out.cause = String(error.cause);
    // Prisma attaches a code that is the actual signal (P2002, P2025…).
    const code = (error as { code?: unknown }).code;
    if (code !== undefined) out.code = code;
    return out;
  }
  return { message: String(error) };
}

/**
 * Field names whose values never belong in a log, no matter who passes them.
 * Cheap insurance: a context object built from a request body would otherwise
 * happily print an access token.
 */
const REDACTED_KEYS =
  /^(password|token|accessToken|secret|authorization|apiKey|signature)$/i;

function sanitise(context: LogContext): LogContext {
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    if (REDACTED_KEYS.test(key)) {
      out[key] = "[redacted]";
    } else if (value instanceof Error) {
      out[key] = serialiseError(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

function emit(level: LogLevel, scope: string, message: string, context?: LogContext) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[minimumLevel()]) return;

  const fields = context ? sanitise(context) : undefined;

  if (process.env.NODE_ENV === "production") {
    const line = JSON.stringify({
      level,
      scope,
      message,
      timestamp: new Date().toISOString(),
      ...fields,
    });
    // `console` is the transport Vercel captures; the structure is what matters.
    if (level === "error") console.error(line);
    else if (level === "warn") console.warn(line);
    else console.log(line);
    return;
  }

  const prefix = `[${scope}]`;
  const args: unknown[] = [prefix, message];
  if (fields && Object.keys(fields).length > 0) args.push(fields);

  if (level === "error") console.error(...args);
  else if (level === "warn") console.warn(...args);
  else console.log(...args);
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: unknown, context?: LogContext): void;
  /** Narrower logger that inherits this scope and merges extra context. */
  child(scope: string, context?: LogContext): Logger;
}

function build(scope: string, bound: LogContext = {}): Logger {
  const merge = (context?: LogContext) =>
    context || Object.keys(bound).length ? { ...bound, ...context } : undefined;

  return {
    debug: (message, context) => emit("debug", scope, message, merge(context)),
    info: (message, context) => emit("info", scope, message, merge(context)),
    warn: (message, context) => emit("warn", scope, message, merge(context)),
    error: (message, error, context) =>
      emit("error", scope, message, {
        ...merge(context),
        ...(error !== undefined ? { error: serialiseError(error) } : {}),
      }),
    child: (childScope, context) =>
      build(`${scope}:${childScope}`, { ...bound, ...context }),
  };
}

/**
 * Create a logger for a subsystem. The scope is what you filter by later, so
 * name it after the thing that can break: `whatsapp`, `cron:reminders`,
 * `webhook:mercadopago`.
 */
export function createLogger(scope: string, context?: LogContext): Logger {
  return build(scope, context);
}

/** Fallback for code that has no meaningful scope of its own. */
export const logger = createLogger("app");
