import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "payments:read");

    const payments = await db.payment.findMany({
      where: { businessId: session.businessId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        appointment: {
          select: {
            dateTime: true,
            service: { select: { name: true } },
            staff: { select: { name: true } },
            user: { select: { name: true } },
            guestClient: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: payments });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
