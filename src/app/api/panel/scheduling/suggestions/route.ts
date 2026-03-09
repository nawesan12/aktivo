import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { getSmartSuggestions } from "@/lib/smart-scheduling";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();

    const { searchParams } = request.nextUrl;
    const userId = searchParams.get("userId");
    const guestClientId = searchParams.get("guestClientId");
    const serviceId = searchParams.get("serviceId") || undefined;

    if (!userId && !guestClientId) {
      return NextResponse.json({ data: [] });
    }

    const suggestions = await getSmartSuggestions({
      businessId: session.businessId,
      userId,
      guestClientId,
      serviceId,
    });

    return NextResponse.json({ data: suggestions });
  } catch (error) {
    return handleApiError(error);
  }
}
