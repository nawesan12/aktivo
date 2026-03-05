import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { getRetentionData } from "@/lib/analytics/retention";
import { getLTVData } from "@/lib/analytics/ltv";
import { getPeakHoursData } from "@/lib/analytics/peak-hours";
import { getChurnData } from "@/lib/analytics/churn";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "analytics:read");

    const [retention, ltv, peakHours, churn] = await Promise.all([
      getRetentionData(session.businessId, 6),
      getLTVData(session.businessId, 10),
      getPeakHoursData(session.businessId, 90),
      getChurnData(session.businessId, 30, 10),
    ]);

    return NextResponse.json({
      retention,
      ltv,
      peakHours,
      churn,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
