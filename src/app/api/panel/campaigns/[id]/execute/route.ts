import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { sendCampaignEmail } from "@/lib/notifications/campaign-email";

const BATCH_SIZE = 5;

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

    // Get already-sent recipients for idempotency
    const alreadySent = await db.campaignExecution.findMany({
      where: { campaignId: campaign.id, status: "SENT" },
      select: { userId: true, guestClientId: true },
    });
    const sentKeys = new Set(
      alreadySent.map((e) => e.userId || e.guestClientId || "")
    );

    // Get target clients based on tags
    const hasTagFilter = campaign.targetTagIds.length > 0;

    const userWhere: Record<string, unknown> = {
      appointments: { some: { businessId: session.businessId } },
    };
    if (hasTagFilter) {
      userWhere.tagAssignments = {
        some: { tagId: { in: campaign.targetTagIds } },
      };
    }

    const users = await db.user.findMany({
      where: userWhere,
      select: { id: true, name: true, email: true, phone: true },
    });

    const guestWhere: Record<string, unknown> = {
      businessId: session.businessId,
    };
    if (hasTagFilter) {
      guestWhere.tagAssignments = {
        some: { tagId: { in: campaign.targetTagIds } },
      };
    }

    const guests = await db.guestClient.findMany({
      where: guestWhere,
      select: { id: true, name: true, email: true, phone: true },
    });

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { name: true },
    });

    // Build recipients, skip already-sent
    const allClients = [
      ...users.map((u) => ({ ...u, type: "user" as const })),
      ...guests.map((g) => ({ ...g, type: "guest" as const })),
    ].filter((c) => !sentKeys.has(c.id));

    let sentCount = 0;
    let errorCount = 0;

    // Send in parallel batches of BATCH_SIZE
    for (let i = 0; i < allClients.length; i += BATCH_SIZE) {
      const batch = allClients.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (client) => {
          const recipient = campaign.channel === "EMAIL" ? client.email : client.phone;
          if (!recipient) return { success: false, skipped: true };

          const variables: Record<string, string> = {
            clientName: client.name || "Cliente",
            businessName: business?.name || "",
          };

          const result = await sendCampaignEmail({
            to: recipient,
            subject: campaign.messageSubject || campaign.name,
            body: campaign.messageBody,
            businessName: business?.name || "",
            variables,
          });

          await db.campaignExecution.create({
            data: {
              campaignId: campaign.id,
              userId: client.type === "user" ? client.id : undefined,
              guestClientId: client.type === "guest" ? client.id : undefined,
              recipient,
              status: result.success ? "SENT" : "FAILED",
              error: result.error || undefined,
              sentAt: result.success ? new Date() : undefined,
            },
          });

          return result;
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") {
          if (r.value && "skipped" in r.value) continue;
          if (r.value?.success) sentCount++;
          else errorCount++;
        } else {
          errorCount++;
        }
      }
    }

    // Set status: COMPLETED only if at least one sent; keep DRAFT if all failed
    const newStatus = sentCount > 0 ? "COMPLETED" : errorCount > 0 ? "DRAFT" : "COMPLETED";
    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: newStatus },
    });

    return NextResponse.json({ sent: sentCount, errors: errorCount });
  } catch (error) {
    return handleApiError(error);
  }
}
