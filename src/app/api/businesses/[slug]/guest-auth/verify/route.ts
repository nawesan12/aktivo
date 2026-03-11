import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyCode, createGuestToken } from "@/lib/guest-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIP(request);
    const { success } = rateLimit({ key: `guest-verify:${ip}`, limit: 10, windowMs: 300_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
    }

    const { slug } = await params;
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const result = await verifyCode(phone, code, business.id);

    if (!result) {
      return NextResponse.json({ error: "Codigo invalido o expirado" }, { status: 401 });
    }

    const token = await createGuestToken(result.guestClientId, business.id);

    const response = NextResponse.json({ success: true });
    response.cookies.set("guest-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Guest auth verify error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
