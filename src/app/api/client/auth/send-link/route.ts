import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sendAccessLink } from "@/lib/client-auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-errors";
import { isValidArgentinePhone, phoneLookupVariants } from "@/lib/phone";
import { maskEmail } from "@/lib/format";
import { normaliseEmail } from "@/lib/client-identity";
import { runInBackground } from "@/lib/background";

const bodySchema = z.object({
  /** An email address or an Argentine phone number — whatever they remember. */
  identifier: z.string().min(1),
});

/**
 * Finds the inbox to mail a way back in.
 *
 * A phone number is only a route to it. It used to be the key to the whole
 * portal, scoped to one shop, and that is what produced the report this work
 * started from: somebody who booked while signed in was never asked for a
 * number, so no `GuestClient` row carried one, so the portal told them there
 * were no appointments "with this number" — blaming a value they had never
 * given. Both an address and a number resolve to the same person now.
 */
async function findAccount(
  identifier: string
): Promise<{ email: string; name?: string } | null> {
  const trimmed = identifier.trim();

  if (trimmed.includes("@")) {
    const email = normaliseEmail(trimmed);
    const [user, guest] = await Promise.all([
      db.user.findUnique({ where: { email }, select: { name: true } }),
      db.guestClient.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { name: true },
        orderBy: { updatedAt: "desc" },
      }),
    ]);
    if (!user && !guest) return null;
    return { email, name: user?.name ?? guest?.name ?? undefined };
  }

  if (!isValidArgentinePhone(trimmed)) return null;

  const variants = phoneLookupVariants(trimmed);
  const [guest, user] = await Promise.all([
    // Across every shop, not just one: the same person books at more than one.
    db.guestClient.findFirst({
      where: { phone: { in: variants }, email: { not: null } },
      select: { email: true, name: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.user.findFirst({
      where: { phone: { in: variants } },
      select: { email: true, name: true },
    }),
  ]);

  const found = guest ?? user;
  if (!found?.email) return null;
  return { email: normaliseEmail(found.email), name: found.name ?? undefined };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `client-auth:${ip}`, limit: 5, windowMs: 300_000 });
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Escribí tu email." }, { status: 400 });
    }

    const identifier = parsed.data.identifier.trim();
    if (!identifier.includes("@") && !isValidArgentinePhone(identifier)) {
      return NextResponse.json(
        { error: "Ese no parece un email ni un teléfono argentino." },
        { status: 400 }
      );
    }

    const account = await findAccount(identifier);

    /*
      The same answer whether or not anything was found.

      "No se encontraron turnos con este número" was the wrong end of the stick
      twice over: it accused the value the person typed, when the real problem
      was that their booking had never been indexed by it, and it turned the
      form into a way of asking whether a given address books anywhere.
    */
    if (account) {
      runInBackground("client-access-link", () => sendAccessLink(account.email, account.name));
    }

    return NextResponse.json({
      sent: true,
      email: account ? maskEmail(account.email) : null,
    });
  } catch (error) {
    return handleApiError(error, "client:auth:send-link");
  }
}
