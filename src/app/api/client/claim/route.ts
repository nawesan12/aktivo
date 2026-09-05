import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { claimGuestAppointments, resolveClientIdentity } from "@/lib/client-identity";

const bodySchema = z.object({
  password: z.string().min(8, "Mínimo 8 caracteres"),
  name: z.string().min(2).optional(),
});

/**
 * Turns a verified customer into an account, without a registration form.
 *
 * `/registrarse` creates a business — it asks for a shop name and writes a
 * `Business`, a `BusinessSettings` and a `UserBusiness` — so somebody who only
 * wants to keep track of their haircuts had no way to have an account at all.
 *
 * Only reachable once the person has proved they read the address, either with
 * a session or with the emailed code. That is what makes it safe to create an
 * account on that address: the confirmation link alone must never be enough, or
 * anyone it was forwarded to could claim somebody else's email.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `client-claim:${ip}`, limit: 5, windowMs: 600_000 });
    if (!success) {
      return NextResponse.json(
        { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
        { status: 429 }
      );
    }

    const identity = await resolveClientIdentity();
    if (!identity?.email) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (identity.userId) {
      return NextResponse.json({ error: "Ya tenés una cuenta." }, { status: 409 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "La clave necesita 8 caracteres o más." }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email: identity.email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email. Iniciá sesión." },
        { status: 409 }
      );
    }

    const user = await db.user.create({
      data: {
        email: identity.email,
        name: parsed.data.name ?? identity.name ?? null,
        hashedPassword: await bcrypt.hash(parsed.data.password, 12),
        // The default, spelled out: this account owns no business, and the
        // panel is not where it belongs.
        role: "CLIENT",
        emailVerified: new Date(),
      },
      select: { id: true },
    });

    const claimed = await claimGuestAppointments(user.id, identity.email);

    return NextResponse.json({ success: true, claimed });
  } catch (error) {
    return handleApiError(error, "client:claim");
  }
}
