import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

// GET — Validate token and return appointment info
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const reviewToken = await db.reviewToken.findUnique({
      where: { token },
      include: {
        appointment: {
          include: {
            service: { select: { name: true } },
            staff: { select: { name: true } },
            business: { select: { name: true, logo: true, primaryColor: true } },
          },
        },
        user: { select: { name: true } },
        guestClient: { select: { name: true } },
      },
    });

    if (!reviewToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    }

    if (reviewToken.usedAt) {
      return NextResponse.json({ error: "Ya dejaste tu reseña" }, { status: 410 });
    }

    if (new Date() > reviewToken.expiresAt) {
      return NextResponse.json({ error: "El enlace ha expirado" }, { status: 410 });
    }

    const clientName = reviewToken.user?.name || reviewToken.guestClient?.name || "Cliente";

    return NextResponse.json({
      clientName,
      business: reviewToken.appointment.business,
      service: reviewToken.appointment.service.name,
      staff: reviewToken.appointment.staff.name,
      date: reviewToken.appointment.dateTime,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST — Submit review (no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const reviewToken = await db.reviewToken.findUnique({
      where: { token },
      include: { appointment: true },
    });

    if (!reviewToken) {
      return NextResponse.json({ error: "Token inválido" }, { status: 404 });
    }

    if (reviewToken.usedAt) {
      return NextResponse.json({ error: "Ya dejaste tu reseña" }, { status: 410 });
    }

    if (new Date() > reviewToken.expiresAt) {
      return NextResponse.json({ error: "El enlace ha expirado" }, { status: 410 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 });
    }

    // Create review and mark token as used in a transaction
    const review = await db.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          businessId: reviewToken.businessId,
          appointmentId: reviewToken.appointmentId,
          userId: reviewToken.userId,
          guestClientId: reviewToken.guestClientId,
          rating,
          comment: comment?.trim() || null,
        },
      });

      await tx.reviewToken.update({
        where: { id: reviewToken.id },
        data: { usedAt: new Date() },
      });

      return created;
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    // Keep the specific message for the duplicate-review case; everything else
    // goes through handleApiError so no Prisma internals reach a public endpoint.
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Ya existe una reseña para este turno" }, { status: 409 });
    }
    return handleApiError(error);
  }
}
