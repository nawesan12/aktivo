import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";
import { getBusinessMPConnection } from "@/lib/mercadopago";
import { authorizationUrl, isOAuthConfigured, unlinkAccount } from "@/lib/mercadopago-oauth";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/db";

/** The state of the link, for the panel to render. Never returns a token. */
export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:read");

    const [connection, account] = await Promise.all([
      getBusinessMPConnection(session.businessId),
      db.mercadoPagoAccount.findUnique({
        where: { businessId: session.businessId },
        select: {
          mpUserId: true,
          expiresAt: true,
          connectedAt: true,
          lastError: true,
        },
      }),
    ]);

    return NextResponse.json({
      available: isOAuthConfigured(),
      status: connection.status,
      account: account
        ? {
            mpUserId: account.mpUserId,
            expiresAt: account.expiresAt,
            connectedAt: account.connectedAt,
            lastError: account.lastError,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error, "panel:payments:mercadopago:GET");
  }
}

/** Starts the link. Answers with the URL rather than redirecting, so the panel can show its own state first. */
export async function POST() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:configure");
    await requirePlan(session.businessId, "PROFESSIONAL");

    if (!isOAuthConfigured()) {
      throw new ValidationError(
        "La vinculación con Mercado Pago no está disponible en este momento."
      );
    }

    const url = await authorizationUrl(session.businessId, session.userId);

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "mercadopago:link-started",
      entity: "Business",
      entityId: session.businessId,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error, "panel:payments:mercadopago:POST");
  }
}

/** Unlinks the account. Charging stops; nothing already collected is touched. */
export async function DELETE() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:configure");

    await unlinkAccount(session.businessId);

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "mercadopago:unlinked",
      entity: "Business",
      entityId: session.businessId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "panel:payments:mercadopago:DELETE");
  }
}
