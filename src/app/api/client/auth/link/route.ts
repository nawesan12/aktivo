import { NextRequest, NextResponse } from "next/server";

import { appUrl } from "@/lib/env";
import { createClientToken, verifyAccessLink } from "@/lib/client-auth";
import { CLIENT_TOKEN_COOKIE } from "@/lib/client-identity";
import { handleApiError } from "@/lib/api-errors";

/**
 * The whole of signing in, for a customer.
 *
 * Opening this is what proves they read the inbox, which is why the session it
 * hands back is a verified one — the only kind allowed to reach the
 * appointments of somebody who also has an account.
 */
export async function GET(request: NextRequest) {
  try {
    const linkToken = request.nextUrl.searchParams.get("t");
    const payload = linkToken ? await verifyAccessLink(linkToken) : null;

    if (!payload) {
      // Expired or tampered with: back to the form, which is a working way in
      // rather than an error page.
      return NextResponse.redirect(appUrl("/mis-turnos?link=vencido"));
    }

    const response = NextResponse.redirect(appUrl("/mis-turnos"));
    const token = await createClientToken(payload.email, { name: payload.name, verified: true });
    response.cookies.set(CLIENT_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.delete("guest-token");
    return response;
  } catch (error) {
    return handleApiError(error, "client:auth:link");
  }
}
