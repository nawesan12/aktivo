import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { paymentConfigSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/api-errors";
import { requirePlan } from "@/lib/subscription/enforcement";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:read");

    const settings = await db.businessSettings.findUnique({
      where: { businessId: session.businessId },
      select: {
        paymentMode: true,
        depositPercentage: true,
        depositFixedAmount: true,
        requireDeposit: true,
        cancellationPolicy: true,
      },
    });

    return NextResponse.json({
      paymentMode: settings?.paymentMode || "DISABLED",
      depositPercentage: settings?.depositPercentage,
      depositFixedAmount: settings?.depositFixedAmount,
      requireDeposit: settings?.requireDeposit ?? false,
      cancellationPolicy: settings?.cancellationPolicy,
    });
  } catch (error) {
    return handleApiError(error, "panel:payments:config:GET");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "payments:configure");
    await requirePlan(session.businessId, "PROFESSIONAL");

    const body = await request.json();
    const parsed = paymentConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { paymentMode, depositPercentage, depositFixedAmount } = parsed.data;

    // The MercadoPago credential is deliberately not handled here any more.
    //
    // It used to arrive with every save — the form sent an empty string by
    // default — and an empty string was read as "delete the token". Changing
    // the payment mode silently disconnected the account. Linking now lives in
    // /api/panel/payments/mercadopago, where connecting and disconnecting are
    // separate, explicit actions.
    await db.businessSettings.update({
      where: { businessId: session.businessId },
      data: {
        paymentMode,
        depositPercentage: depositPercentage || null,
        depositFixedAmount: depositFixedAmount || null,
        requireDeposit: paymentMode !== "DISABLED",
      },
    });

    // Free text, so it stays out of the schema and is written on its own.
    if (typeof body.cancellationPolicy === "string") {
      await db.businessSettings.update({
        where: { businessId: session.businessId },
        data: { cancellationPolicy: body.cancellationPolicy || null },
      });
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "payment_config:update",
      entity: "BusinessSettings",
      entityId: session.businessId,
      details: { paymentMode },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "panel:payments:config:PUT");
  }
}
