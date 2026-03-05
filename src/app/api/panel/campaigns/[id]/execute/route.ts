import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { sendCampaignEmail } from "@/lib/notifications/campaign-email";

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

    // Get target clients based on tags
    const hasTagFilter = campaign.targetTagIds.length > 0;

    // Registered users
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

    // Guest clients
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

    let sentCount = 0;
    let errorCount = 0;

    // Send to all recipients
    for (const client of [...users.map((u) => ({ ...u, type: "user" as const })), ...guests.map((g) => ({ ...g, type: "guest" as const }))]) {
      const recipient = campaign.channel === "EMAIL" ? client.email : client.phone;
      if (!recipient) continue;

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

      if (result.success) sentCount++;
      else errorCount++;
    }

    // Update campaign status
    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ sent: sentCount, errors: errorCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
