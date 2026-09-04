import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "reports:export");

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
