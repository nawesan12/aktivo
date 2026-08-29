import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { integrationStatus } from "@/lib/env";
import { createLogger } from "@/lib/logger";

const log = createLogger("health");

/**
 * Liveness / readiness probe.
 *
 * Checks the database round-trip and reports which optional integrations are
 * configured — a deploy missing a variable degrades silently otherwise (no
 * WhatsApp, no email, no payments), and nothing surfaces it.
 *
 * Deliberately public and free of detail: it exposes booleans, never values.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  let database: "up" | "down" = "down";
  try {
    await db.$queryRaw`SELECT 1`;
    database = "up";
  } catch (error) {
    log.error("database check failed", error);
  }

  const integrations = integrationStatus();

  const healthy = database === "up";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      database,
      integrations,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
