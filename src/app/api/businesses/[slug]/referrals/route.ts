import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-errors";
import { AuthError } from "@/lib/api-errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthError();
    }

    const { slug } = await params;

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const referral = await db.referral.findFirst({
      where: {
        businessId: business.id,
        userId: session.user.id,
      },
      include: {
        _count: { select: { redemptions: true } },
      },
    });

    if (!referral) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        code: referral.code,
        totalReferrals: referral._count.redemptions,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new AuthError();
    }

    const { slug } = await params;

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Check if user already has a referral for this business
    const existing = await db.referral.findFirst({
      where: {
        businessId: business.id,
        userId: session.user.id,
      },
    });

    if (existing) {
      return NextResponse.json({ data: { code: existing.code } });
    }

    // Generate unique code with retry on collision
    let code: string;
    let attempts = 0;
    const MAX_ATTEMPTS = 10;

    while (true) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const collision = await db.referral.findUnique({
        where: {
          businessId_code: {
            businessId: business.id,
            code,
          },
        },
      });

      if (!collision) break;

      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: "No se pudo generar un código único" },
          { status: 500 }
        );
      }
    }

    const referral = await db.referral.create({
      data: {
        businessId: business.id,
        userId: session.user.id,
        code,
      },
    });

    return NextResponse.json({ data: { code: referral.code } }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
