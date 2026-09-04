import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "staff:read");

    const staff = await db.staffMember.findUnique({
      where: { id, businessId: session.businessId },
      select: {
        googleCalendarEnabled: true,
        googleCalendarId: true,
        userId: true,
      },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 }
      );
    }

    let hasGoogleAccount = false;
    if (staff.userId) {
      const account = await db.account.findFirst({
        where: { userId: staff.userId, provider: "google" },
      });
      hasGoogleAccount = !!account;
    }

    return NextResponse.json({
      googleCalendarEnabled: staff.googleCalendarEnabled,
      googleCalendarId: staff.googleCalendarId,
      hasGoogleAccount,
      hasLinkedUser: !!staff.userId,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "staff:update");

    const body = await req.json();
    const { googleCalendarEnabled } = body as {
      googleCalendarEnabled: boolean;
    };

    if (googleCalendarEnabled === true) {
      const staff = await db.staffMember.findUnique({
        where: { id, businessId: session.businessId },
        select: { userId: true },
      });

      if (!staff) {
        return NextResponse.json(
          { error: "Staff member not found" },
          { status: 404 }
        );
      }

      if (!staff.userId) {
        return NextResponse.json(
          { error: "Staff member must have a linked user to enable Google Calendar" },
          { status: 400 }
        );
      }

      const account = await db.account.findFirst({
        where: { userId: staff.userId, provider: "google" },
      });

      if (!account) {
        return NextResponse.json(
          { error: "Staff member must have a linked Google account to enable Google Calendar" },
          { status: 400 }
        );
      }
    }

    const updated = await db.staffMember.update({
      where: { id, businessId: session.businessId },
      data: { googleCalendarEnabled },
      select: {
        googleCalendarEnabled: true,
        googleCalendarId: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
