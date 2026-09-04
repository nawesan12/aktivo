import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
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
    await requireBusinessPermission(session, "appointments:update");

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

    // Email is the only channel, so an entry without one cannot be notified.
    // Marking it as notified anyway would drop the person from the queue in
    // silence.
    if (!entry.email) {
      return NextResponse.json(
        { error: "Esta persona no dejó un email, no hay forma de avisarle." },
        { status: 409 }
      );
    }

    const bookingUrl = appUrl(`/${business!.slug}/reservar`);
    const email = entry.email;

    runInBackground("waitlist-notify", async () => {
      await sendEmail({
        to: email,
        type: "waitlist_slot_open",
        businessName: business!.name,
        clientName: entry.name,
        serviceName: entry.service.name,
        staffName: "",
        dateTime: entry.preferredDate,
        bookingUrl,
      });
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
