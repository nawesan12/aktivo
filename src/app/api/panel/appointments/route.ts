import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { listAppointments } from "@/lib/panel/appointments";
import { runInBackground } from "@/lib/background";
import { maybeTick } from "@/lib/jobs/tick";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:read");

    const { searchParams } = request.nextUrl;

    const result = await listAppointments(session.businessId, {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      status: searchParams.get("status"),
      staffId: searchParams.get("staffId"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      search: searchParams.get("search"),
    });

    // Real traffic is what drives the background jobs on the free plan: no
    // Vercel cron can run more than once a day there. See `src/lib/jobs/tick.ts`.
    runInBackground("tick", maybeTick);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "panel:appointments");
  }
}
