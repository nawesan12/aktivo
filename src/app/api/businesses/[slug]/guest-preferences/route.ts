import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { guestClientForBusiness, resolveClientIdentity } from "@/lib/client-identity";

/**
 * Notification preferences a customer keeps at one shop.
 *
 * Still per-business — the preference row is — but the caller is now resolved
 * the same way as everywhere else, so somebody with an account reaches it too
 * instead of getting a 401 from a cookie they never had.
 */
async function resolve(slug: string) {
  const identity = await resolveClientIdentity();
  if (!identity) return { error: NextResponse.json({ error: "No autenticado" }, { status: 401 }) };

  const business = await db.business.findUnique({ where: { slug }, select: { id: true } });
  if (!business) {
    return { error: NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 }) };
  }

  const guest = await guestClientForBusiness(identity, business.id);
  const scope = identity.userId
    ? { businessId_userId: { businessId: business.id, userId: identity.userId } }
    : guest
      ? { businessId_guestClientId: { businessId: business.id, guestClientId: guest.id } }
      : null;

  if (!scope) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 403 }) };
  }

  return { businessId: business.id, userId: identity.userId, guestClientId: guest?.id ?? null, scope };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const resolved = await resolve(slug);
    if ("error" in resolved) return resolved.error;

    const preference = await db.notificationPreference.findUnique({ where: resolved.scope });
    return NextResponse.json(preference);
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-preferences");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const resolved = await resolve(slug);
    if ("error" in resolved) return resolved.error;

    const { emailEnabled, remindersEnabled } = await request.json();

    const preference = await db.notificationPreference.upsert({
      where: resolved.scope,
      update: { emailEnabled, remindersEnabled },
      create: {
        businessId: resolved.businessId,
        userId: resolved.userId,
        guestClientId: resolved.guestClientId,
        emailEnabled,
        remindersEnabled,
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    return handleApiError(error, "businesses:slug:guest-preferences");
  }
}
