import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMPClient } from "@/lib/mercadopago";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { getPlatformPreApproval } from "@/lib/subscription/mp-platform";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription/config";
import { addDays } from "date-fns";
import { createHmac } from "crypto";

// ── Webhook signature verification ───────────────────────

function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // In development, skip verification if no secret configured
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not configured — skipping signature verification");
    return true;
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    return false;
  }

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {};
  for (const part of xSignature.split(",")) {
    const [key, value] = part.split("=", 2);
    if (key && value) parts[key.trim()] = value.trim();
  }

  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Extract data.id from body for the manifest
  let dataId = "";
  try {
    const parsed = JSON.parse(body);
    dataId = parsed.data?.id ? String(parsed.data.id) : "";
  } catch {
    return false;
  }

  // Build manifest: id:[data.id];request-id:[x-request-id];ts:[ts];
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex");

  return hmac === v1;
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, bodyText)) {
      console.warn("MercadoPago webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);

    if (body.type === "payment" && body.data?.id) {
      return handlePaymentWebhook(String(body.data.id));
    }

    if (body.type === "subscription_preapproval" && body.data?.id) {
      return handleSubscriptionWebhook(String(body.data.id));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ── B2C: Appointment payment ──────────────────────────────

async function handlePaymentWebhook(paymentId: string) {
  // First, find the payment record to get the business context
  // We need to search by mpPaymentId (if already set) or check all pending payments
  const existingByMpId = await db.payment.findFirst({
    where: { mpPaymentId: paymentId },
    include: {
      appointment: {
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          user: { select: { name: true, phone: true, email: true } },
          guestClient: { select: { name: true, phone: true, email: true } },
          business: { select: { id: true, name: true } },
        },
      },
    },
  });

  // Idempotency: if we already processed this payment with the same status, skip
  if (existingByMpId && existingByMpId.mpPaymentId === paymentId && existingByMpId.status !== "PENDING" && existingByMpId.status !== "IN_PROCESS") {
    return NextResponse.json({ received: true, skipped: "already_processed" });
  }

  // Get the business MP token for this payment's business
  const businessId = existingByMpId?.appointment?.business?.id || existingByMpId?.businessId;
  let businessMpToken: string | undefined;

  if (businessId) {
    const mpConfig = await db.businessConfig.findUnique({
      where: {
        businessId_key: {
          businessId,
          key: "mp_access_token",
        },
      },
    });
    businessMpToken = mpConfig?.value || undefined;
  }

  // Use the business-specific token to query MP
  const mpClient = getMPClient(businessMpToken);
  const mpPayment = await mpClient.payment.get({ id: paymentId });

  if (!mpPayment || !mpPayment.external_reference) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const appointmentId = mpPayment.external_reference;
  const mpStatus = mpPayment.status;

  // If we didn't find by mpPaymentId, find by appointmentId
  const payment = existingByMpId || await db.payment.findUnique({
    where: { appointmentId },
    include: {
      appointment: {
        include: {
          service: { select: { name: true } },
          staff: { select: { name: true } },
          user: { select: { name: true, phone: true, email: true } },
          guestClient: { select: { name: true, phone: true, email: true } },
          business: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
  }

  let paymentStatus: "APPROVED" | "REJECTED" | "PENDING" | "IN_PROCESS" | "CANCELLED";
  let appointmentStatus: string | null = null;

  switch (mpStatus) {
    case "approved":
      paymentStatus = "APPROVED";
      appointmentStatus = "CONFIRMED";
      break;
    case "rejected":
      paymentStatus = "REJECTED";
      break;
    case "in_process":
      paymentStatus = "IN_PROCESS";
      break;
    case "cancelled":
      paymentStatus = "CANCELLED";
      break;
    default:
      paymentStatus = "PENDING";
  }

  // Idempotency: skip if status unchanged
  if (payment.status === paymentStatus && payment.mpPaymentId === paymentId) {
    return NextResponse.json({ received: true, skipped: "no_change" });
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      mpPaymentId: paymentId,
      mpStatus: mpStatus || null,
      status: paymentStatus,
    },
  });

  if (appointmentStatus) {
    await db.appointment.update({
      where: { id: appointmentId },
      data: { status: appointmentStatus as "CONFIRMED" },
    });
  }

  if (mpStatus === "approved" && payment.appointment) {
    const apt = payment.appointment;
    const clientName = apt.user?.name || apt.guestClient?.name || "Cliente";
    const clientPhone = apt.user?.phone || apt.guestClient?.phone;
    const clientEmail = apt.user?.email || apt.guestClient?.email;

    sendNotification({
      businessId: apt.business.id,
      businessName: apt.business.name,
      appointmentId,
      clientName,
      clientPhone: clientPhone || undefined,
      clientEmail: clientEmail || undefined,
      serviceName: apt.service.name,
      staffName: apt.staff.name,
      dateTime: apt.dateTime,
      type: "confirmation",
    }).catch(console.error);
  }

  await logAction({
    businessId: payment.businessId,
    action: "payment:webhook",
    entity: "Payment",
    entityId: payment.id,
    details: { mpPaymentId: paymentId, mpStatus, paymentStatus },
  });

  return NextResponse.json({ received: true });
}

// ── B2B: Subscription preapproval ─────────────────────────

async function handleSubscriptionWebhook(preapprovalId: string) {
  const preApproval = getPlatformPreApproval();
  const mpSub = await preApproval.get({ id: preapprovalId });

  if (!mpSub) {
    return NextResponse.json({ error: "Preapproval not found" }, { status: 404 });
  }

  // Find subscription by MP preapproval ID or external reference
  const subscription = await db.subscription.findFirst({
    where: {
      OR: [
        { mpPreapprovalId: preapprovalId },
        ...(mpSub.external_reference
          ? [{ externalReference: mpSub.external_reference }]
          : []),
      ],
    },
  });

  if (!subscription) {
    console.warn("Subscription webhook: no matching record for", preapprovalId);
    return NextResponse.json({ received: true });
  }

  const mpStatus = mpSub.status; // "authorized", "paused", "cancelled", "pending"

  switch (mpStatus) {
    case "authorized": {
      await db.$transaction([
        db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "AUTHORIZED",
            mpPreapprovalId: preapprovalId,
            payerEmail: mpSub.payer_email || subscription.payerEmail,
            startDate: mpSub.date_created ? new Date(mpSub.date_created) : new Date(),
            nextPaymentDate: mpSub.next_payment_date
              ? new Date(mpSub.next_payment_date)
              : null,
            lastPaymentDate: new Date(),
            gracePeriodEnd: null,
          },
        }),
        db.business.update({
          where: { id: subscription.businessId },
          data: { plan: subscription.plan },
        }),
      ]);
      break;
    }

    case "paused": {
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAUSED",
          gracePeriodEnd: addDays(new Date(), GRACE_PERIOD_DAYS),
        },
      });
      break;
    }

    case "cancelled": {
      // If user cancelled from panel, they already have cancelledAt set.
      // Use nextPaymentDate as grace period so they keep access until the period they paid for.
      const hasUserCancelled = !!subscription.cancelledAt;
      const gracePeriodEnd = hasUserCancelled && subscription.nextPaymentDate
        ? subscription.nextPaymentDate
        : null;

      if (gracePeriodEnd && gracePeriodEnd > new Date()) {
        // User cancelled but still has paid time — keep plan with grace period
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "PAUSED",
            gracePeriodEnd,
            cancelReason: subscription.cancelReason || "Cancelado desde MercadoPago",
          },
        });
      } else {
        // No remaining paid time — downgrade immediately
        await db.$transaction([
          db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "CANCELLED",
              cancelledAt: subscription.cancelledAt || new Date(),
              cancelReason: subscription.cancelReason || "Cancelado desde MercadoPago",
            },
          }),
          db.business.update({
            where: { id: subscription.businessId },
            data: { plan: "FREE" },
          }),
        ]);
      }
      break;
    }
  }

  await logAction({
    businessId: subscription.businessId,
    action: "subscription:webhook",
    entity: "Subscription",
    entityId: subscription.id,
    details: { mpStatus, preapprovalId },
  });

  return NextResponse.json({ received: true });
}
