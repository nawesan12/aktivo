import { db } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { JOBS, type Job } from "./registry";

const log = createLogger("jobs:tick");

/**
 * Gate in front of everything else. Under a burst of requests, all but one do a
 * single UPDATE that matches no rows and go home.
 */
const TICK = { name: "tick", intervalSeconds: 60 };

/** Stop claiming new jobs past this, so a tick never stretches a request. */
const BUDGET_MS = 8_000;

/**
 * Claims a job for this process, or returns false if someone else has it.
 *
 * The atomicity is in the statement, not around it. Under READ COMMITTED, a
 * second concurrent UPDATE on the same row blocks on the row lock and, once
 * released, re-evaluates its WHERE against the *updated* row: it sees the fresh
 * `lastRunAt`, the predicate is false, and RETURNING gives back nothing. Exactly
 * one winner, without SERIALIZABLE or advisory locks.
 *
 * The obvious version — SELECT, compare in JS, UPDATE — is racy, and looks
 * correct right up until two instances run the same job at the same second.
 */
async function claimJob(name: string, intervalSeconds: number): Promise<boolean> {
  const claimed = await db.$queryRaw<{ name: string }[]>`
    UPDATE "JobRun"
       SET "lastRunAt" = now(), "runs" = "runs" + 1
     WHERE "name" = ${name}
       AND "lastRunAt" < now() - make_interval(secs => ${intervalSeconds}::int)
    RETURNING "name"
  `;

  return claimed.length > 0;
}

async function recordOutcome(name: string, error: unknown) {
  await db.jobRun.update({
    where: { name },
    data: {
      lastEndAt: new Date(),
      lastError: error
        ? (error instanceof Error ? error.message : String(error)).slice(0, 500)
        : null,
    },
  });
}

export interface TickResult {
  ran: Record<string, unknown>;
  skipped: string[];
}

/**
 * Runs every job whose interval has elapsed.
 *
 * `force` skips the per-job throttle and is what the daily cron uses: it is the
 * floor under the whole scheme, and it must not be talked out of running by a
 * tick that happened to fire a minute earlier.
 */
export async function runDueJobs({ force = false } = {}): Promise<TickResult> {
  const started = Date.now();
  const ran: Record<string, unknown> = {};
  const skipped: string[] = [];

  const candidates: Job[] = force ? JOBS : JOBS.filter((j) => j.opportunistic);

  for (const job of candidates) {
    if (!force && Date.now() - started > BUDGET_MS) {
      skipped.push(job.name);
      continue;
    }

    if (!force && !(await claimJob(job.name, job.intervalSeconds))) {
      skipped.push(job.name);
      continue;
    }

    // A forced run did not go through claimJob, so it has to mark the row
    // itself — otherwise the next opportunistic tick redoes the same work.
    if (force) {
      await db.jobRun.update({
        where: { name: job.name },
        data: { lastRunAt: new Date(), runs: { increment: 1 } },
      });
    }

    // One broken job must not stop the rest.
    try {
      ran[job.name] = await job.run();
      await recordOutcome(job.name, null);
    } catch (error) {
      log.error("job failed", error, { job: job.name });
      ran[job.name] = { failed: true };
      await recordOutcome(job.name, error);
    }
  }

  return { ran, skipped };
}

/**
 * Entry point for opportunistic runs. Call it through `runInBackground` so the
 * request never waits for it and a broken tick cannot break a booking.
 */
export async function maybeTick(): Promise<TickResult | null> {
  if (!(await claimJob(TICK.name, TICK.intervalSeconds))) return null;

  return runDueJobs();
}
