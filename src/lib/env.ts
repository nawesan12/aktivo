import { z } from "zod";

/**
 * Centralised environment configuration.
 *
 * Before this existed, 24 different variables were read with `process.env.X`
 * scattered across 40+ files, each with its own fallback. A deploy missing a
 * variable did not fail: it degraded silently — no emails, no payments — and
 * nobody noticed until a customer complained.
 *
 * Here the contract is explicit and checked once, at startup (see
 * `src/instrumentation.ts`). Anything genuinely optional stays optional, but
 * *partially* configured integrations are treated as errors: half a payment
 * setup is a silent outage waiting to happen.
 */

const secret = (min = 16) =>
  z.string().min(min, `must be at least ${min} characters`);

const baseSchema = z.object({
  // ── Core: the app cannot serve a request without these ──────────────────
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), {
      message: "must be a postgres:// connection string",
    }),
  AUTH_SECRET: secret(),
  NEXT_PUBLIC_APP_URL: z.url("must be an absolute URL, e.g. https://jikuapp.com"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Read directly by `src/lib/logger.ts`; declared here so it is documented. */
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
  NEXTAUTH_URL: z.url().optional(),

  // ── Auth extras ─────────────────────────────────────────────────────────
  // Without these, sign-in with Google is hidden and only email + password works.
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** Signs the guest-token cookie. Falls back to AUTH_SECRET, domain-separated. */
  GUEST_JWT_SECRET: secret().optional(),
  /** Encrypts each business's MercadoPago token at rest. Falls back to AUTH_SECRET. */
  ENCRYPTION_KEY: secret().optional(),

  // ── Payments ────────────────────────────────────────────────────────────
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().optional(),
  MP_PLATFORM_ACCESS_TOKEN: z.string().optional(),
  MP_PLAN_PROFESSIONAL_ID: z.string().optional(),
  MP_PLAN_ENTERPRISE_ID: z.string().optional(),
  /** OAuth: lets a business link its own MercadoPago with a button. */
  MP_CLIENT_ID: z.string().optional(),
  MP_CLIENT_SECRET: z.string().optional(),

  // ── Email ───────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM: z.string().optional(),

  // ── Scheduled jobs ──────────────────────────────────────────────────────
  CRON_SECRET: secret().optional(),
  /** Legacy name for CRON_SECRET, still honoured by the reminders endpoint. */
  REMINDERS_SECRET: z.string().optional(),

  // ── Rate limiting ───────────────────────────────────────────────────────
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  // What Vercel's Upstash integration injects. Read directly instead of being
  // copied into the two above: a copy would keep working after the credentials
  // are rotated, right up until it didn't.
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),

  // ── Images ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
});

type BaseEnv = z.infer<typeof baseSchema>;

/**
 * Integrations that only work when *every* variable of the group is present.
 * A half-configured group is worse than an absent one: the feature looks
 * enabled and fails at the worst moment.
 */
const GROUPS: {
  name: string;
  keys: (keyof BaseEnv)[];
}[] = [
  { name: "Email (Resend)", keys: ["RESEND_API_KEY", "RESEND_FROM"] },
  {
    name: "Google sign-in",
    keys: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
  {
    name: "Upstash Redis",
    keys: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  },
  { name: "Upstash Redis (Vercel)", keys: ["KV_REST_API_URL", "KV_REST_API_TOKEN"] },
  {
    name: "Cloudinary",
    keys: [
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET",
    ],
  },
  { name: "MercadoPago (appointment payments)", keys: ["MERCADOPAGO_ACCESS_TOKEN", "MERCADOPAGO_WEBHOOK_SECRET"] },
  {
    name: "Platform billing",
    keys: [
      "MP_PLATFORM_ACCESS_TOKEN",
      "MP_PLAN_PROFESSIONAL_ID",
      "MP_PLAN_ENTERPRISE_ID",
    ],
  },
  { name: "MercadoPago OAuth", keys: ["MP_CLIENT_ID", "MP_CLIENT_SECRET"] },
];

/**
 * Required in production only. In development the app is expected to run with
 * integrations switched off; in production their absence is a broken deploy.
 */
const REQUIRED_IN_PRODUCTION: (keyof BaseEnv)[] = ["CRON_SECRET"];

interface HalfConfigured {
  name: string;
  missing: (keyof BaseEnv)[];
}

/** Groups where some keys are set and others are not. */
function halfConfiguredGroups(env: Partial<BaseEnv>): HalfConfigured[] {
  const problems: HalfConfigured[] = [];

  for (const group of GROUPS) {
    const present = group.keys.filter((k) => Boolean(env[k]));
    if (present.length === 0 || present.length === group.keys.length) continue;
    problems.push({ name: group.name, missing: group.keys.filter((k) => !env[k]) });
  }

  return problems;
}

const envSchema = baseSchema.superRefine((env, ctx) => {
  const isProduction = env.NODE_ENV === "production";

  // Only fatal in production. A half-configured integration is a broken deploy,
  // but locally it is routine — nobody wants a MercadoPago webhook secret just
  // to work on the booking form, and refusing to start would make them fake one.
  if (isProduction) {
    for (const problem of halfConfiguredGroups(env)) {
      ctx.addIssue({
        code: "custom",
        path: [problem.missing[0]],
        message: `${problem.name} is half configured — missing ${problem.missing.join(", ")}. Set all of them or none.`,
      });
    }
  }

  if (isProduction) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!env[key]) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "is required in production",
        });
      }
    }

    if (env.NEXT_PUBLIC_APP_URL.startsWith("http://")) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "must use https in production",
      });
    }
  }
});

export type Env = z.infer<typeof envSchema>;

/**
 * `next build` renders pages without the production secrets available, so
 * validating during the build phase would fail every CI run for the wrong
 * reason. Validation belongs to startup and to request time.
 */
function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function shouldSkipValidation(): boolean {
  return process.env.SKIP_ENV_VALIDATION === "1" || isBuildPhase();
}

let cached: Env | null = null;

function loadEnv(): Env {
  if (cached) return cached;

  // During the build the production-only rules (a cron secret, an https URL)
  // describe the deployed server, not the machine compiling the bundle.
  const source = isBuildPhase()
    ? { ...process.env, NODE_ENV: "development" }
    : process.env;

  const result = envSchema.safeParse(source);

  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");

    if (shouldSkipValidation()) {
      // Not a hard failure here, but never silent either. One compact line:
      // the build renders pages in several processes and would repeat it.
      const keys = [...new Set(result.error.issues.map((i) => i.path.join(".")))];
      console.warn(`[env] not validated (build phase). Problems with: ${keys.join(", ")}`);
      cached = process.env as unknown as Env;
      return cached;
    }

    throw new Error(`Invalid environment configuration:\n${detail}`);
  }

  cached = result.data;

  // Outside production the same problems are worth saying out loud, once.
  if (cached.NODE_ENV !== "production") {
    for (const problem of halfConfiguredGroups(cached)) {
      console.warn(
        `[env] ${problem.name} is half configured — missing ${problem.missing.join(", ")}. That integration will not work.`
      );
    }
  }

  return cached;
}

/**
 * Validated environment. Server-side only: reading it from a client component
 * throws, because `process.env` there holds just the NEXT_PUBLIC_* subset.
 *
 * Lazy on purpose — module import order must not decide whether the app boots.
 */
export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return loadEnv()[prop as keyof Env];
  },
  has(_target, prop: string) {
    return prop in loadEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(loadEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return {
      value: loadEnv()[prop as keyof Env],
      enumerable: true,
      configurable: true,
    };
  },
});

/** Throws on invalid configuration. Called once from `instrumentation.ts`. */
export function assertEnv(): void {
  loadEnv();
}

/**
 * The Redis credentials, from whichever pair is configured.
 *
 * `UPSTASH_*` is what the code was written against; `KV_*` is what Vercel's
 * Upstash integration injects. Both name the same service.
 */
export function redisCredentials(): { url: string; token: string } | null {
  const e = loadEnv();

  const url = e.UPSTASH_REDIS_REST_URL || e.KV_REST_API_URL;
  const token = e.UPSTASH_REDIS_REST_TOKEN || e.KV_REST_API_TOKEN;

  return url && token ? { url, token } : null;
}

/**
 * Which optional integrations are actually usable. Used by `/api/health` and
 * the admin system page instead of each one re-reading `process.env`.
 */
export function integrationStatus() {
  const e = loadEnv();
  return {
    email: Boolean(e.RESEND_API_KEY),
    mercadopago: Boolean(e.MERCADOPAGO_ACCESS_TOKEN),
    mercadopagoOAuth: Boolean(e.MP_CLIENT_ID && e.MP_CLIENT_SECRET),
    platformBilling: Boolean(e.MP_PLATFORM_ACCESS_TOKEN),
    googleAuth: Boolean(e.GOOGLE_CLIENT_ID && e.GOOGLE_CLIENT_SECRET),
    redisRateLimit: Boolean(redisCredentials()),
    cloudinary: Boolean(e.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME),
    cron: Boolean(e.CRON_SECRET),
  };
}

/**
 * Absolute URL for a path in this app.
 *
 * Two variables were being used interchangeably for the same thing:
 * `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL`. The latter is not set anywhere, so
 * the review links and the waitlist booking links were being built as
 * `undefined/review/<token>` and mailed out like that.
 */
export function appUrl(path = ""): string {
  const base = loadEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  if (!path) return base;
  return `${base}/${path.replace(/^\/+/, "")}`;
}

/** Default `from` for transactional email, overridable per call site. */
export function emailFrom(fallbackName?: string): string {
  const configured = loadEnv().RESEND_FROM;
  if (configured) return configured;
  return fallbackName
    ? `${fallbackName} <onboarding@resend.dev>`
    : "Jiku <onboarding@resend.dev>";
}
