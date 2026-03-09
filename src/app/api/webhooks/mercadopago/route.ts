import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMPClient } from "@/lib/mercadopago";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { getPlatformPreApproval } from "@/lib/subscription/mp-platform";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription/config";
import { addDays } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === "payment" && body.data?.id) {
      return handlePaymentWebhook(body.data.id);
    }

    if (body.type === "subscription_preapproval" && body.data?.id) {
      return handleSubscriptionWebhook(body.data.id);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("MercadoPago webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ── B2C: Appointment payment ──────────────────────────────

async function handlePaymentWebhook(paymentId: string) {
  const mpClient = getMPClient();
  const mpPayment = await mpClient.payment.get({ id: paymentId });

  if (!mpPayment || !mpPayment.external_reference) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const appointmentId = mpPayment.external_reference;
  const mpStatus = mpPayment.status;

  const payment = await db.payment.findUnique({
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
      await db.$transaction([
        db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: "Cancelado desde MercadoPago",
          },
        }),
        db.business.update({
          where: { id: subscription.businessId },
          data: { plan: "FREE" },
        }),
      ]);
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
