import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/notifications/invite-email";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "team:read");

    const members = await db.userBusiness.findMany({
      where: { businessId: session.businessId },
      select: {
        id: true,
        role: true,
        isActive: true,
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });

    // Pending invitations
    const invitations = await db.verificationToken.findMany({
      where: {
        identifier: { startsWith: `invite_${session.businessId}_` },
        expires: { gt: new Date() },
      },
    });

    const pendingInvites = invitations.map((inv) => ({
      email: inv.identifier.replace(`invite_${session.businessId}_`, ""),
      expires: inv.expires,
    }));

    return NextResponse.json({ members, pendingInvites });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "team:invite");

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const validRoles = ["BUSINESS_MANAGER", "STAFF_MEMBER", "RECEPTIONIST"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Rol invalido" }, { status: 400 });
    }

    // Check if already a member
    const existing = await db.userBusiness.findFirst({
      where: {
        businessId: session.businessId,
        user: { email: email.toLowerCase() },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Este usuario ya es miembro" }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const identifier = `invite_${session.businessId}_${email.toLowerCase()}`;

    await db.verificationToken.upsert({
      where: { identifier_token: { identifier, token } },
      create: {
        identifier,
        token,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      update: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      select: { name: true },
    });

    await sendInviteEmail(email.toLowerCase(), token, business?.name || "Jiku");

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "team:invite",
      entity: "invitation",
      details: { email, role: role || "STAFF_MEMBER" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
