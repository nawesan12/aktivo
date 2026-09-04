import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMPClient, getBusinessMPToken, getBusinessByMPUserId } from "@/lib/mercadopago";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/notifications/email";
import { getPlatformPreApproval, getAuthorizedPayment } from "@/lib/subscription/mp-platform";
import { GRACE_PERIOD_DAYS } from "@/lib/subscription/config";
import { addDays } from "date-fns";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { runInBackground } from "@/lib/background";
import { maybeTick } from "@/lib/jobs/tick";
import { isSlotTakenError } from "@/lib/api-errors";

const log = createLogger("webhook:mercadopago");

// ── Webhook signature verification ───────────────────────

function verifyWebhookSignature(request: NextRequest, body: string): boolean {
  const secret = env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed. Trusting unsigned callbacks here would let anyone mark a
    // booking as paid; a missing secret is a misconfiguration, not a dev mode.
    log.error("MERCADOPAGO_WEBHOOK_SECRET is not set — rejecting webhook");
    return false;
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

  // The id comes from the query string when MercadoPago puts it there, which is
  // what its own documentation signs. Reading it only from the body meant a
  // notification whose body shape differed at all — and MercadoPago has more
  // than one — produced a manifest that could never match.
  const queryId =
    request.nextUrl.searchParams.get("data.id") ?? request.nextUrl.searchParams.get("id");

  let bodyId = "";
  try {
    const parsed = JSON.parse(body);
    bodyId = parsed.data?.id ? String(parsed.data.id) : "";
  } catch {
    // A body we cannot read is not automatically a failure: the manifest may
    // still be built from the query string.
  }

  // Lowercased, as the documentation requires for alphanumeric ids.
  const dataId = (queryId ?? bodyId).toLowerCase();

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest();

  let received: Buffer;
  try {
    received = Buffer.from(v1, "hex");
  } catch {
    return false;
  }

  // Constant time, so the comparison cannot leak the signature one byte at a
  // time to somebody willing to send enough requests.
  if (received.length !== expected.length) return false;
  return timingSafeEqual(received, expected);
}

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(request, bodyText)) {
      log.warn("invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(bodyText);

    if (body.type === "payment" && body.data?.id) {
      // `user_id` is the seller MercadoPago is notifying about. It is the only
      // thing in the first notification that identifies the business, since the
      // payment id is not on any of our rows yet.
      return handlePaymentWebhook(
        String(body.data.id),
        body.user_id ? String(body.user_id) : null
      );
    }

    if (body.type === "subscription_preapproval" && body.data?.id) {
      return handleSubscriptionWebhook(String(body.data.id));
    }

    // The monthly charge itself. Without this, a rejected renewal only reached
    // us if MercadoPago also happened to pause the preapproval — so a business
    // could stop paying and keep the plan indefinitely.
    if (body.type === "subscription_authorized_payment" && body.data?.id) {
      return handleSubscriptionPaymentWebhook(String(body.data.id));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error("webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// ── B2C: Appointment payment ──────────────────────────────

async function handlePaymentWebhook(paymentId: string, mpUserId: string | null) {
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

  // Which business is this, and with whose token do we ask MercadoPago about it?
  //
  // The row lookup only works from the second notification onwards, because the
  // first one arrives before `mpPaymentId` has been written. Falling back to the
  // seller id fixes exactly that gap: without it, the first notification of
  // every payment was answered with the platform token, got a 404 because the
  // payment belongs to somebody else's account, and was dropped — the customer
  // paid and the booking stayed unconfirmed.
  const businessId =
    existingByMpId?.appointment?.business?.id ||
    existingByMpId?.businessId ||
    (mpUserId ? await getBusinessByMPUserId(mpUserId) : null);

  const businessMpToken = businessId ? await getBusinessMPToken(businessId) : null;

  if (!businessMpToken) {
    log.warn("no usable MercadoPago credential for this notification", {
      paymentId,
      businessId,
      mpUserId,
    });
    return NextResponse.json({ received: true, skipped: "no_credential" });
  }

  const mpClient = getMPClient(businessMpToken);

  // A payment MercadoPago cannot hand us is not a transient failure, and
  // answering 500 to one is: they retry a 500, forever, on a notification that
  // is never going to succeed. Only a real outage should ask them to come back.
  let mpPayment;
  try {
    mpPayment = await mpClient.payment.get({ id: paymentId });
  } catch (error) {
    const status = (error as { status?: number })?.status;

    if (status === 404 || status === 400) {
      log.warn("MercadoPago does not know this payment", { paymentId, status });
      return NextResponse.json({ received: true, skipped: "unknown_payment" });
    }

    throw error;
  }

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

  // The customer paid, but the slot may be gone: the hold expires after 15
  // minutes and whoever booked it next now owns it as far as the exclusion
  // constraint is concerned. Confirming blindly throws 23P01, the webhook
  // answers 500, and MercadoPago retries the same failure forever — meaning
  // nobody ever finds out that someone paid for nothing.
  let slotLost = false;

  if (appointmentStatus) {
    try {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { status: appointmentStatus as "CONFIRMED" },
      });
    } catch (error) {
      if (!isSlotTakenError(error)) throw error;

      slotLost = true;

      // The payment stays APPROVED against a cancelled appointment on purpose:
      // that is what surfaces it in the panel's payments list, where the refund
      // button already exists. Losing the record would lose the debt.
      log.error("payment approved but the slot was already taken", error, {
        appointmentId,
        paymentId,
        businessId: payment.businessId,
      });

      await logAction({
        businessId: payment.businessId,
        action: "payment:slot-lost",
        entity: "Payment",
        entityId: payment.id,
        details: { mpPaymentId: paymentId, appointmentId, refundPending: true },
      });

      // Telling them beats letting them show up to a turn that does not exist.
      const apt = payment.appointment;
      const email = apt?.user?.email || apt?.guestClient?.email;

      if (apt && email) {
        runInBackground("payment-slot-lost", () =>
          sendEmail({
            to: email,
            type: "slot_lost",
            businessName: apt.business.name,
            clientName: apt.user?.name || apt.guestClient?.name || "Cliente",
            serviceName: apt.service.name,
            staffName: apt.staff.name,
            dateTime: apt.dateTime,
          }), { appointmentId });
      }
    }
  }

  if (mpStatus === "approved" && !slotLost && payment.appointment) {
    const apt = payment.appointment;
    const clientName = apt.user?.name || apt.guestClient?.name || "Cliente";
    const clientEmail = apt.user?.email || apt.guestClient?.email;

    runInBackground("payment-confirmation", () =>
      sendNotification({
        businessId: apt.business.id,
        businessName: apt.business.name,
        appointmentId,
        clientName,
        clientEmail: clientEmail || undefined,
        serviceName: apt.service.name,
        staffName: apt.staff.name,
        dateTime: apt.dateTime,
        type: "confirmation",
      }), { appointmentId });
  }

  await logAction({
    businessId: payment.businessId,
    action: "payment:webhook",
    entity: "Payment",
    entityId: payment.id,
    details: { mpPaymentId: paymentId, mpStatus, paymentStatus },
  });

  // Webhooks arrive even when nobody is browsing the site, which makes them one
  // of the more reliable tick sources. See `src/lib/jobs/tick.ts`.
  runInBackground("tick", maybeTick);

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
    log.warn("no subscription matches the preapproval", { preapprovalId });
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
            data: { plan: "STARTER" },
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

// ── B2B: the monthly charge ───────────────────────────────

/** MercadoPago's own words for a charge that went through. */
const SETTLED = new Set(["processed", "approved", "accredited"]);

/**
 * A renewal was charged, or failed to be.
 *
 * The preapproval webhook only fires when the *subscription* changes state, and
 * MercadoPago keeps a subscription "authorized" while it retries a card that
 * keeps bouncing. Without listening here, a business that stopped paying kept
 * its plan until somebody noticed by hand.
 */
async function handleSubscriptionPaymentWebhook(authorizedPaymentId: string) {
  const authorized = await getAuthorizedPayment(authorizedPaymentId);

  if (!authorized?.preapproval_id) {
    log.warn("authorized payment without a preapproval", { authorizedPaymentId });
    return NextResponse.json({ received: true });
  }

  const subscription = await db.subscription.findFirst({
    where: { mpPreapprovalId: authorized.preapproval_id },
  });

  if (!subscription) {
    log.warn("no subscription matches the authorized payment", {
      authorizedPaymentId,
      preapprovalId: authorized.preapproval_id,
    });
    return NextResponse.json({ received: true });
  }

  const settled =
    SETTLED.has(String(authorized.status)) ||
    SETTLED.has(String(authorized.payment?.status));

  if (settled) {
    await db.$transaction([
      db.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "AUTHORIZED",
          lastPaymentDate: new Date(),
          nextPaymentDate: authorized.debit_date ? new Date(authorized.debit_date) : null,
          gracePeriodEnd: null,
        },
      }),
      db.business.update({
        where: { id: subscription.businessId },
        data: { plan: subscription.plan },
      }),
    ]);
  } else {
    // Not cancelled: MercadoPago retries a failed charge for a few days, and so
    // do we. The grace period is what keeps a business working through a card
    // that expired over the weekend.
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "PAUSED",
        gracePeriodEnd:
          subscription.gracePeriodEnd ?? addDays(new Date(), GRACE_PERIOD_DAYS),
      },
    });

    log.warn("subscription charge did not settle", {
      subscriptionId: subscription.id,
      businessId: subscription.businessId,
      status: authorized.status,
      paymentStatus: authorized.payment?.status,
    });
  }

  await logAction({
    businessId: subscription.businessId,
    action: "subscription:charge",
    entity: "Subscription",
    entityId: subscription.id,
    details: { authorizedPaymentId, settled, status: authorized.status },
  });

  return NextResponse.json({ received: true });
}
