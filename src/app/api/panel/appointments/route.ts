import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { handleApiError } from "@/lib/api-errors";
import { listAppointments } from "@/lib/panel/appointments";

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

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "panel:appointments");
  }
}
