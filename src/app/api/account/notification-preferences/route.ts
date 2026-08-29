import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const preferences = await db.notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json(preferences);
  } catch (error) {
    return handleApiError(error, "account:notification-preferences");
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { businessId, emailEnabled, whatsappEnabled, remindersEnabled } =
      await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId es requerido" },
        { status: 400 }
      );
    }

    const preference = await db.notificationPreference.upsert({
      where: {
        businessId_userId: {
          businessId,
          userId: session.user.id,
        },
      },
      update: {
        emailEnabled,
        whatsappEnabled,
        remindersEnabled,
      },
      create: {
        businessId,
        userId: session.user.id,
        emailEnabled,
        whatsappEnabled,
        remindersEnabled,
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    return handleApiError(error, "account:notification-preferences");
  }
}
