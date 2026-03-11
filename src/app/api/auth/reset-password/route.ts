import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
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
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
