import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { runCampaign } from "@/lib/campaigns/run";

/**
 * Runs a campaign on demand.
 *
 * The audience, the cooldown and the channel all live in `@/lib/campaigns`, so
 * this button and the daily cron behave the same. It used to have its own copy
 * of the logic which ignored the campaign type — a birthday campaign greeted
 * every client of the business on whatever day the button was pressed — and
 * always sent email even when the campaign's channel was WhatsApp.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:manage");
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const result = await runCampaign(campaign);

    // A one-off blast is done once it has run. The automated ones stay active:
    // they are meant to keep firing on their trigger.
    if (campaign.type === "CUSTOM" && result.sent > 0) {
      await db.campaign.update({
        where: { id: campaign.id },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({
      sent: result.sent,
      errors: result.failed,
      skipped: result.skipped,
      audience: result.audience,
    });
  } catch (error) {
    return handleApiError(error, "panel:campaigns:execute");
  }
}
