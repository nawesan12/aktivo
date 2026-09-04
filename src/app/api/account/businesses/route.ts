import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

/**
 * The businesses this person has booked at.
 *
 * The referrals screen has been calling this route since it was written; it
 * never existed, so the screen fetched a 404, rendered "generá tu código" with
 * no business selected, and the button was permanently disabled. Every account
 * that opened it saw a dead end.
 *
 * Only businesses that actually run a referral programme come back — offering
 * to generate a code for a business that gives nothing in return is a promise
 * we can't keep.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const appointments = await db.appointment.findMany({
      where: { userId: session.user.id },
      select: {
        business: {
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            settings: {
              select: {
                referralEnabled: true,
                referralRewardType: true,
                referralRewardValue: true,
              },
            },
          },
        },
      },
      distinct: ["businessId"],
      orderBy: { dateTime: "desc" },
      take: 50,
    });

    const data = appointments
      .map((appointment) => appointment.business)
      .filter((business) => business.settings?.referralEnabled)
      .map((business) => ({
        id: business.id,
        slug: business.slug,
        name: business.name,
        logo: business.logo,
        rewardType: business.settings?.referralRewardType ?? null,
        rewardValue: business.settings?.referralRewardValue
          ? Number(business.settings.referralRewardValue)
          : null,
      }));

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, "account.businesses");
  }
}
