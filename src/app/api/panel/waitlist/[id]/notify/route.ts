import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { sendWhatsAppText } from "@/lib/notifications/whatsapp";
import { sendEmail } from "@/lib/notifications/email";
import { handleApiError } from "@/lib/api-errors";
import { appUrl } from "@/lib/env";
import { runInBackground } from "@/lib/background";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:update");

    const { id } = await params;

    const entry = await db.waitlistEntry.findFirst({
      where: { id, businessId: session.businessId },
      include: {
        service: { select: { name: true } },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Entrada de lista de espera no encontrada" },
        { status: 404 }
      );
    }

    if (entry.notified) {
      return NextResponse.json(
        { error: "Esta entrada ya fue notificada" },
        { status: 400 }
      );
    }

    if (entry.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Esta entrada ya expiró" },
        { status: 400 }
      );
    }

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { name: true, slug: true },
    });

    const bookingUrl = appUrl(`/${business!.slug}/reservar`);
    const message = `¡Buenas noticias! Se liberó un turno para ${entry.service.name}. Reservá ahora: ${bookingUrl}`;

    runInBackground("waitlist-notify", async () => {
      await sendWhatsAppText(entry.phone, message);
      if (entry.email) {
        await sendEmail({
          to: entry.email,
          type: "cancellation",
          businessName: business!.name,
          clientName: entry.name,
          serviceName: entry.service.name,
          staffName: "",
          dateTime: entry.preferredDate,
        });
      }
    }, { entryId: entry.id });

    await db.waitlistEntry.update({
      where: { id: entry.id },
      data: { notified: true, notifiedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
