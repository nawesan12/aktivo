import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";

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
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
