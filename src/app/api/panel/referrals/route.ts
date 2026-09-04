import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "reports:read");

    const [rawReferrals, totalRedemptions] = await Promise.all([
      db.referral.findMany({
        where: { businessId: session.businessId },
        include: {
          _count: { select: { redemptions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.referralRedemption.count({
        where: { referral: { businessId: session.businessId } },
      }),
    ]);

    // Fetch user/guest names for each referral
    const referrals = await Promise.all(
      rawReferrals.map(async (r) => {
        let referrerName = "Desconocido";
        let referrerEmail: string | null = null;
        if (r.userId) {
          const user = await db.user.findUnique({
            where: { id: r.userId },
            select: { name: true, email: true },
          });
          if (user) {
            referrerName = user.name || "Sin nombre";
            referrerEmail = user.email;
          }
        } else if (r.guestClientId) {
          const guest = await db.guestClient.findUnique({
            where: { id: r.guestClientId },
            select: { name: true, email: true },
          });
          if (guest) {
            referrerName = guest.name;
            referrerEmail = guest.email;
          }
        }
        return {
          id: r.id,
          code: r.code,
          referrerName,
          referrerEmail,
          redemptions: r._count.redemptions,
          createdAt: r.createdAt,
        };
      })
    );

    return NextResponse.json({
      referrals,
      totalCodes: referrals.length,
      totalRedemptions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
