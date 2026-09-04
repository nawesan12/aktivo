import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { sendInviteEmail } from "@/lib/notifications/invite-email";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "team:read");

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
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "team:invite");

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    const validRoles = ["BUSINESS_MANAGER", "STAFF_MEMBER", "RECEPTIONIST"];
    if (role && !validRoles.includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
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

    // The role travels in the identifier. It used to be validated, written to
    // the audit log, and then dropped: whoever accepted an invitation became a
    // STAFF_MEMBER regardless of what was chosen, which made the role selector
    // decorative.
    const invitedRole = role || "STAFF_MEMBER";
    const identifier = `invite_${session.businessId}_${invitedRole}_${email.toLowerCase()}`;

    // Any earlier invitation for this business and email stops working. The
    // upsert it replaces matched on a token that had just been generated, so it
    // never found anything and every re-invite left another live token behind.
    await db.verificationToken.deleteMany({
      where: { identifier: { startsWith: `invite_${session.businessId}_` }, },
    });

    await db.verificationToken.create({
      data: {
        identifier,
        token,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
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
    return handleApiError(error);
  }
}
