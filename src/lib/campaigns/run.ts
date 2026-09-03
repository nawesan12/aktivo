import { db } from "@/lib/db";
import { sendCampaignEmail } from "@/lib/notifications/campaign-email";
import { createLogger } from "@/lib/logger";
import { cooldownDays, resolveAudience, type Recipient } from "./audience";
import type { Campaign } from "@/generated/prisma/client";

const log = createLogger("campaigns");

/** Recipients handled at a time, to stay within the provider's rate limits. */
const BATCH_SIZE = 5;

export interface CampaignRunResult {
  campaignId: string;
  audience: number;
  sent: number;
  failed: number;
  skipped: number;
}

/**
 * Recipients already contacted recently enough that contacting them again would
 * be spam. Without this the daily cron would send the same "we miss you" every
 * morning, forever, to the same people.
 */
async function recentlyContacted(campaign: Campaign): Promise<Set<string>> {
  const cooldown = cooldownDays(campaign);

  const since = Number.isFinite(cooldown)
    ? new Date(Date.now() - cooldown * 86_400_000)
    : undefined;

  const executions = await db.campaignExecution.findMany({
    where: {
      campaignId: campaign.id,
      status: "SENT",
      ...(since ? { sentAt: { gte: since } } : {}),
    },
    select: { userId: true, guestClientId: true },
  });

  return new Set(executions.map((e) => e.userId || e.guestClientId || ""));
}

/**
 * Runs one campaign: resolve the audience, skip whoever was contacted inside
 * the cooldown, send through the campaign's own channel, and record every
 * attempt as a `CampaignExecution`.
 *
 * Shared by the "run now" button and the daily cron so both behave identically.
 */
export async function runCampaign(campaign: Campaign): Promise<CampaignRunResult> {
  const [audience, alreadySent, business] = await Promise.all([
    resolveAudience(campaign),
    recentlyContacted(campaign),
    db.business.findUnique({
      where: { id: campaign.businessId },
      select: { name: true },
    }),
  ]);

  const pending = audience.filter((client) => !alreadySent.has(client.id));

  let sent = 0;
  let failed = 0;
  let skipped = audience.length - pending.length;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((client) => deliver(campaign, client, business?.name ?? ""))
    );

    for (const result of results) {
      if (result.status === "rejected") {
        failed++;
      } else if (result.value === "skipped") {
        skipped++;
      } else if (result.value === "sent") {
        sent++;
      } else {
        failed++;
      }
    }
  }

  return { campaignId: campaign.id, audience: audience.length, sent, failed, skipped };
}

async function deliver(
  campaign: Campaign,
  client: Recipient,
  businessName: string
): Promise<"sent" | "failed" | "skipped"> {
  // Email is the only channel. A client without an address cannot be reached,
  // and saying so as "skipped" keeps it out of the failure count.
  const recipient = client.email;
  if (!recipient) return "skipped";

  const variables = {
    clientName: client.name || "Cliente",
    businessName,
  };

  let error: string | undefined;

  try {
    const result = await sendCampaignEmail({
      to: recipient,
      subject: campaign.messageSubject || campaign.name,
      body: campaign.messageBody,
      businessName,
      variables,
    });
    if (!result.success) error = result.error ?? "Unknown error";
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Unknown error";
  }

  await db.campaignExecution.create({
    data: {
      campaignId: campaign.id,
      userId: client.type === "user" ? client.id : undefined,
      guestClientId: client.type === "guest" ? client.id : undefined,
      recipient,
      status: error ? "FAILED" : "SENT",
      error,
      sentAt: error ? undefined : new Date(),
    },
  });

  return error ? "failed" : "sent";
}

/**
 * Runs every active automated campaign across all businesses. CUSTOM campaigns
 * are excluded on purpose: a free-form blast is the owner's decision, not
 * something that should fire on a schedule.
 */
export async function runScheduledCampaigns(): Promise<CampaignRunResult[]> {
  const campaigns = await db.campaign.findMany({
    where: {
      status: "ACTIVE",
      type: { in: ["BIRTHDAY", "REBOOKING", "INACTIVITY"] },
    },
  });

  const results: CampaignRunResult[] = [];

  for (const campaign of campaigns) {
    try {
      const result = await runCampaign(campaign);
      results.push(result);
      if (result.sent > 0 || result.failed > 0) {
        log.info("campaign executed", { ...result, type: campaign.type });
      }
    } catch (error) {
      // One broken campaign must not stop the rest of the platform's.
      log.error("campaign run failed", error, {
        campaignId: campaign.id,
        businessId: campaign.businessId,
      });
    }
  }

  return results;
}
