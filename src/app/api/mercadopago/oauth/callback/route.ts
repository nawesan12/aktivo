import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { linkAccount, verifyState } from "@/lib/mercadopago-oauth";

const log = createLogger("mercadopago:oauth:callback");

/** Back to the payments screen, saying how it went. */
function back(result: "ok" | "denied" | "invalid" | "failed") {
  return NextResponse.redirect(appUrl(`/panel/pagos?mp=${result}`));
}

/**
 * Where MercadoPago sends the owner after they authorise the link.
 *
 * Public by necessity — it is a browser redirect, not an API call — so the
 * `state` is what proves the request belongs to the business that started the
 * flow. Without checking it, anyone could link their own MercadoPago account to
 * somebody else's business by crafting a URL, and from then on collect that
 * business's deposits.
 */
export async function GET(request: NextRequest) {
  try {
    const { success } = await rateLimit({
      key: `mp-oauth:${getClientIP(request)}`,
      limit: 10,
      windowMs: 300_000,
    });
    if (!success) return back("failed");

    const params = request.nextUrl.searchParams;
    const code = params.get("code");
    const state = params.get("state");

    // The owner pressed "cancel" on MercadoPago's screen.
    if (params.get("error") || !code) {
      return back("denied");
    }

    if (!state) return back("invalid");

    const claim = await verifyState(state);
    if (!claim) {
      log.warn("callback with an invalid or expired state");
      return back("invalid");
    }

    await linkAccount(claim.businessId, code);

    await logAction({
      businessId: claim.businessId,
      userId: claim.userId,
      action: "mercadopago:linked",
      entity: "Business",
      entityId: claim.businessId,
    });

    return back("ok");
  } catch (error) {
    // Never surface the raw failure in the URL: it can carry the reason
    // MercadoPago rejected the exchange, which is not for the browser.
    log.error("could not complete the link", error);
    return back("failed");
  }
}
