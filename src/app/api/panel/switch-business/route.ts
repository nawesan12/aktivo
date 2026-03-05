import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";

/**
 * Switch the active business in the user's session.
 * Verifies the user has access to the target business.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();

    const body = await request.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    // Verify user has access to target business
    const membership = await db.userBusiness.findUnique({
      where: {
        userId_businessId: {
          userId: session.userId,
          businessId,
        },
      },
      include: {
        business: { select: { slug: true, name: true } },
      },
    });

    if (!membership || !membership.isActive) {
      return NextResponse.json({ error: "Sin acceso a este negocio" }, { status: 403 });
    }

    // The actual session update happens client-side by updating the JWT
    // Return the business info for the client to store
    return NextResponse.json({
      businessId: membership.businessId,
      businessSlug: membership.business.slug,
      businessName: membership.business.name,
      role: membership.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
