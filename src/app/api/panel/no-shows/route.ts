import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { getNoShowStats } from "@/lib/no-show";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "noshow:read");

    const stats = await getNoShowStats(session.businessId);

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
