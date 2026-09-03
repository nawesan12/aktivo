import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCode, sendVerificationCode, createVerification } from "@/lib/guest-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-errors";
import { phoneLookupVariants } from "@/lib/phone";
import { maskEmail } from "@/lib/format";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `guest-auth:${ip}`, limit: 5, windowMs: 300_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos. Intenta en unos minutos." }, { status: 429 });
    }

    const { slug } = await params;
    const { phone } = await request.json();

    if (!phone || typeof phone !== "string" || phone.length < 10) {
      return NextResponse.json({ error: "Teléfono inválido" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Check if guest client exists
    const guestClient = await db.guestClient.findFirst({
      where: { businessId: business.id, phone: { in: phoneLookupVariants(phone) } },
    });

    if (!guestClient) {
      return NextResponse.json({ error: "No se encontraron turnos con este número" }, { status: 404 });
    }

    // The code travels by email, so a guest without one cannot be verified.
    // Only reservations made before email became mandatory can land here.
    if (!guestClient.email) {
      return NextResponse.json(
        {
          error:
            "Esta reserva no tiene un email asociado. Contactate con el negocio para gestionar tu turno.",
        },
        { status: 409 }
      );
    }

    const code = generateCode();
    await createVerification(phone, code);
    await sendVerificationCode(guestClient.email, code, business.name);

    return NextResponse.json({ success: true, email: maskEmail(guestClient.email) });
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-auth:send-code");
  }
}
