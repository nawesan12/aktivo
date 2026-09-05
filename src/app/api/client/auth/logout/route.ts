import { NextResponse } from "next/server";
import { CLIENT_TOKEN_COOKIE } from "@/lib/client-identity";

/** Drops the code-verified session. Signed-in users sign out through NextAuth. */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(CLIENT_TOKEN_COOKIE);
  return response;
}
