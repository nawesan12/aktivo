import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateCode, sendVerificationCode, createVerification } from "@/lib/guest-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIP(request);
    const { success } = rateLimit({ key: `guest-auth:${ip}`, limit: 5, windowMs: 300_000 });
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
    const guestClient = await db.guestClient.findUnique({
      where: { businessId_phone: { businessId: business.id, phone } },
    });

    if (!guestClient) {
      return NextResponse.json({ error: "No se encontraron turnos con este numero" }, { status: 404 });
    }

    const code = generateCode();
    await createVerification(phone, code);
    await sendVerificationCode(phone, code, business.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest auth send-code error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
