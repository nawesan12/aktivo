import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { paymentConfigSchema } from "@/lib/validations";
import { getMPClient } from "@/lib/mercadopago";

export async function GET() {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "payments:read");

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

    // Get MP token from BusinessConfig
    const mpConfig = await db.businessConfig.findUnique({
      where: {
        businessId_key: {
          businessId: session.businessId,
          key: "mp_access_token",
        },
      },
    });

    return NextResponse.json({
      paymentMode: settings?.paymentMode || "DISABLED",
      depositPercentage: settings?.depositPercentage,
      depositFixedAmount: settings?.depositFixedAmount,
      cancellationPolicy: settings?.cancellationPolicy,
      hasMpToken: !!mpConfig?.value,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "payments:configure");

    const body = await request.json();
    const parsed = paymentConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { paymentMode, depositPercentage, depositFixedAmount, mpAccessToken } = parsed.data;

    // Test MP token if provided
    if (mpAccessToken) {
      try {
        const client = getMPClient(mpAccessToken);
        // Verify token by making a test API call
        await client.payment.search({ options: { limit: 1 } });
      } catch {
        return NextResponse.json({ error: "Token de MercadoPago invalido" }, { status: 400 });
      }
    }

    await db.businessSettings.update({
      where: { businessId: session.businessId },
      data: {
        paymentMode,
        depositPercentage: depositPercentage || null,
        depositFixedAmount: depositFixedAmount || null,
        requireDeposit: paymentMode !== "DISABLED",
      },
    });

    // Store MP token
    if (mpAccessToken !== undefined) {
      if (mpAccessToken) {
        await db.businessConfig.upsert({
          where: {
            businessId_key: {
              businessId: session.businessId,
              key: "mp_access_token",
            },
          },
          update: { value: mpAccessToken },
          create: {
            businessId: session.businessId,
            key: "mp_access_token",
            value: mpAccessToken,
          },
        });
      } else {
        await db.businessConfig.deleteMany({
          where: {
            businessId: session.businessId,
            key: "mp_access_token",
          },
        });
      }
    }

    // Store cancellation policy
    if (body.cancellationPolicy !== undefined) {
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
    const message = error instanceof Error ? error.message : "Error interno";
    const status = message.includes("No autenticado") || message.includes("Sin negocio") ? 401
      : message.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
