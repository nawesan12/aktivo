import { NextRequest, NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { assertBusinessCanWrite } from "@/lib/subscription/access";
import { handleApiError, NotFoundError } from "@/lib/api-errors";
import { redeliverNotification } from "@/lib/notifications/redelivery";

/**
 * Re-sends one notification.
 *
 * The log listed failures and offered nothing: the owner could see that a
 * client never got their reminder and had no way to do anything about it except
 * phone them. The background job gives up after four tries; a person pressing
 * the button has usually just fixed whatever was wrong.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    // `notifications:read` rather than `:configure`: this is an operational
    // retry, not a settings change. A manager who can cancel a turno — which
    // mails the client — can certainly re-send a confirmation.
    await requireBusinessPermission(session, "notifications:read");
    // Said out loud because the permission above is in the read-only set, so
    // `requireBusinessPermission` does not check the subscription for it — and
    // this does send mail on the business's behalf.
    await assertBusinessCanWrite(session.businessId);

    const { id } = await params;
    const outcome = await redeliverNotification(session.businessId, id);

    if (outcome === "not_found") throw new NotFoundError("Notificación no encontrada");

    if (outcome === "abandoned") {
      return NextResponse.json(
        { error: "Ese turno ya no existe o fue cancelado, no hay nada que reenviar" },
        { status: 409 }
      );
    }

    if (outcome === "failed") {
      return NextResponse.json(
        { error: "Volvió a fallar. Revisá que el email del cliente esté bien." },
        { status: 502 }
      );
    }

    return NextResponse.json({ status: "SENT" });
  } catch (error) {
    return handleApiError(error, "panel:notifications:reenviar");
  }
}
