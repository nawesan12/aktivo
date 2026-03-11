import { NextRequest, NextResponse } from "next/server";

// Google Calendar integration temporarily disabled
// TODO: re-enable once googleCalendarEnabled field is migrated

export async function GET() {
  return NextResponse.json({
    googleCalendarEnabled: false,
    googleCalendarId: null,
    hasGoogleAccount: false,
    hasLinkedUser: false,
    disabled: true,
  });
}

export async function PATCH() {
  return NextResponse.json(
    { error: "Google Calendar integration is temporarily disabled" },
    { status: 503 }
  );
}
