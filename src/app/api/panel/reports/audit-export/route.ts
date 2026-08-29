import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reports:export");

    const { entity, details } = await request.json();

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "pdf:export",
      entity: entity || "unknown",
      details: details || {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
