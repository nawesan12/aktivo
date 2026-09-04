import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { runCampaign } from "@/lib/campaigns/run";
import { resolveAudience } from "@/lib/campaigns/audience";
import { runInBackground } from "@/lib/background";

/**
 * Runs a campaign on demand.
 *
 * The audience, the cooldown and the channel all live in `@/lib/campaigns`, so
 * this button and the daily cron behave the same. It used to have its own copy
 * of the logic which ignored the campaign type — a birthday campaign greeted
 * every client of the business on whatever day the button was pressed — and
 * always sent email even when the campaign's channel was WhatsApp.
 *
 * The sending happens after the response. It used to run inside it: with a few
 * hundred clients the owner watched a spinner for a minute and the browser gave
 * up before the send did, leaving them with no idea how many mails went out.
 * Now they get the audience size straight away and the progress shows up in the
 * campaign's own counters as it goes.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "campaigns:manage");
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const audience = await resolveAudience(campaign);

    if (audience.length === 0) {
      return NextResponse.json({
        queued: false,
        audience: 0,
        message: "Ningún cliente entra en esta campaña todavía.",
      });
    }

    runInBackground(
      "campaigns:execute",
      async () => {
        const result = await runCampaign(campaign);

        // A one-off blast is done once it has run. The automated ones stay
        // active: they are meant to keep firing on their trigger.
        if (campaign.type === "CUSTOM" && result.sent > 0) {
          await db.campaign.update({
            where: { id: campaign.id },
            data: { status: "COMPLETED" },
          });
        }
      },
      { campaignId: campaign.id, businessId: session.businessId }
    );

    return NextResponse.json({ queued: true, audience: audience.length }, { status: 202 });
  } catch (error) {
    return handleApiError(error, "panel:campaigns:execute");
  }
}
