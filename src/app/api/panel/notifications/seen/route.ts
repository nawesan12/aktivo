import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

/**
 * "Ya lo vi": corre la marca hasta ahora y el contador vuelve a cero.
 *
 * Una escritura por apertura de la campanita, sobre una sola fila. La
 * alternativa —marcar cada notificación— sería una escritura por correo
 * enviado, miles al mes por negocio, para un badge.
 */
export async function POST() {
  try {
    const session = await getSessionBusiness();

    await db.businessSettings.updateMany({
      where: { businessId: session.businessId },
      data: { notificationsSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "panel:notifications:seen");
  }
}
