import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "campaigns:read");
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    }

    const [total, sent, failed, pending] = await Promise.all([
      db.campaignExecution.count({ where: { campaignId: id } }),
      db.campaignExecution.count({ where: { campaignId: id, status: "SENT" } }),
      db.campaignExecution.count({ where: { campaignId: id, status: "FAILED" } }),
      db.campaignExecution.count({ where: { campaignId: id, status: "PENDING" } }),
    ]);

    return NextResponse.json({
      total,
      sent,
      failed,
      pending,
      deliveryRate: total > 0 ? Math.round((sent / total) * 100) : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
