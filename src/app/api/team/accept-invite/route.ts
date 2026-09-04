import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { handleApiError } from "@/lib/api-errors";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Public and it creates accounts, so it needs a ceiling like the rest of
    // the auth surface.
    const { success } = await rateLimit({
      key: `accept-invite:${getClientIP(request)}`,
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos. Intentá en 15 minutos." }, { status: 429 });
    }

    const body = await request.json();
    const { token, name, password } = body;

    if (!token) {
      return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    // Find the invitation token
    const invitation = await db.verificationToken.findFirst({
      where: {
        token,
        identifier: { startsWith: "invite_" },
        expires: { gt: new Date() },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 400 });
    }

    // Parse: "invite_{businessId}_{role}_{email}"
    const parts = invitation.identifier.split("_");
    const businessId = parts[1];
    const invitedRole = parts[2];
    const email = parts.slice(3).join("_");

    const ALLOWED_ROLES = ["BUSINESS_MANAGER", "STAFF_MEMBER", "RECEPTIONIST"] as const;
    type InvitedRole = (typeof ALLOWED_ROLES)[number];

    if (!businessId || !email || !ALLOWED_ROLES.includes(invitedRole as InvitedRole)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    const role = invitedRole as InvitedRole;

    // Check if user exists
    let user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // No account yet. The page can send name and password to create one right
      // here, joined to the business that invited them.
      //
      // It used to point them at /registrarse, which requires a business name
      // and creates a new business — so the invitee ended up owning a business
      // of their own and never joined the one that invited them.
      if (!name || !password) {
        return NextResponse.json({ needsRegistration: true, email });
      }

      if (password.length < PASSWORD_MIN_LENGTH) {
        return NextResponse.json(
          { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres` },
          { status: 400 }
        );
      }

      user = await db.user.create({
        data: {
          email,
          name: String(name).trim(),
          hashedPassword: await bcrypt.hash(String(password), 12),
          emailVerified: new Date(),
          role: "CLIENT",
        },
      });
    }

    // Upsert UserBusiness
    const existing = await db.userBusiness.findFirst({
      where: { userId: user.id, businessId },
    });

    if (existing) {
      await db.userBusiness.update({
        where: { id: existing.id },
        data: { isActive: true, role },
      });
    } else {
      await db.userBusiness.create({
        data: {
          userId: user.id,
          businessId,
          role,
          isActive: true,
        },
      });
    }

    // Delete token
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: invitation.identifier,
          token: invitation.token,
        },
      },
    });

    return NextResponse.json({ success: true, email });
  } catch (error) {
    return handleApiError(error, "team:accept-invite");
  }
}
