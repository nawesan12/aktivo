import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    // The only route in the auth surface that had no ceiling. The token is
    // hashed and the space is large, so guessing one is not the worry — an
    // unbounded endpoint that writes a password hash is.
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `reset:${ip}`, limit: 10, windowMs: 15 * 60 * 1000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos. Intenta en 15 minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid token
    const verificationToken = await db.verificationToken.findFirst({
      where: {
        token: hashedToken,
        expires: { gt: new Date() },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.user.update({
      where: { id: user.id },
      data: { hashedPassword },
    });

    // Delete used token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    });

    await logAction({
      userId: user.id,
      action: "auth:reset_password",
      entity: "user",
      entityId: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "auth:reset-password");
  }
}
