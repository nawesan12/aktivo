import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { hashedPassword: true },
    });

    if (!user?.hashedPassword) {
      return NextResponse.json(
        { error: "Tu cuenta usa Google. Gestiona tu contraseña desde Google." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Las contraseñas no coinciden" }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    await logAction({
      userId: session.user.id,
      action: "account:change_password",
      entity: "user",
      entityId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account password error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
