/**
 * Environment for unit tests.
 *
 * `src/lib/env.ts` validates configuration on first access, so any module that
 * reads it needs a valid set here. These are fixed dummy values: unit tests must
 * never depend on the developer's real `.env`, and must never reach the actual
 * database or third-party services.
 */
// NODE_ENV is already "test" under Vitest, and its type is read-only.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/jiku_test";
process.env.AUTH_SECRET ??= "unit-test-secret-not-a-real-one";
process.env.NEXT_PUBLIC_APP_URL ??= "http://localhost:3000";
