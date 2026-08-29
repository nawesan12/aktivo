import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

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

    // Parse: "invite_{businessId}_{email}"
    const parts = invitation.identifier.split("_");
    const businessId = parts[1];
    const email = parts.slice(2).join("_");

    if (!businessId || !email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ needsRegistration: true, email });
    }

    // Upsert UserBusiness
    const existing = await db.userBusiness.findFirst({
      where: { userId: user.id, businessId },
    });

    if (existing) {
      await db.userBusiness.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await db.userBusiness.create({
        data: {
          userId: user.id,
          businessId,
          role: "STAFF_MEMBER",
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

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "team:accept-invite");
  }
}
