import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyGuestToken } from "@/lib/guest-auth";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get("guest-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const guest = await verifyGuestToken(token);
    if (!guest) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verify business matches
    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const preference = await db.notificationPreference.findUnique({
      where: {
        businessId_guestClientId: {
          businessId: guest.businessId,
          guestClientId: guest.guestClientId,
        },
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-preferences");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const token = request.cookies.get("guest-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const guest = await verifyGuestToken(token);
    if (!guest) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // Verify business matches
    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business || business.id !== guest.businessId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { emailEnabled, remindersEnabled } =
      await request.json();

    const preference = await db.notificationPreference.upsert({
      where: {
        businessId_guestClientId: {
          businessId: guest.businessId,
          guestClientId: guest.guestClientId,
        },
      },
      update: {
        emailEnabled,
        remindersEnabled,
      },
      create: {
        businessId: guest.businessId,
        guestClientId: guest.guestClientId,
        emailEnabled,
        remindersEnabled,
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-preferences");
  }
}
