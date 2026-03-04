import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { sendPasswordResetEmail } from "@/lib/notifications/password-reset-email";

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    const { success } = rateLimit({ key: `forgot:${ip}`, limit: 3, windowMs: 15 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en 15 minutos." }, { status: 429 });
    }

    const body = await request.json();
    const email = body.email?.trim()?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await db.user.findUnique({ where: { email } });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      // Upsert verification token
      await db.verificationToken.upsert({
        where: { identifier_token: { identifier: email, token: hashedToken } },
        create: {
          identifier: email,
          token: hashedToken,
          expires: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
        update: {
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      await sendPasswordResetEmail(email, token);

      await logAction({
        userId: user.id,
        action: "auth:forgot_password",
        entity: "user",
        entityId: user.id,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
