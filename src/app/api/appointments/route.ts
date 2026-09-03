import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { getMPClient, getBusinessMPToken } from "@/lib/mercadopago";
import { calculatePaymentAmount } from "@/lib/pricing";
import { appointmentSchema, guestInfoSchema } from "@/lib/validations";
import { calculateCouponDiscount, applyDiscount } from "@/lib/pricing";
import { handleApiError } from "@/lib/api-errors";
import { getAvailableSlots } from "@/lib/availability";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { formatArgentinaDate, parseDateInArgentina } from "@/lib/timezone";
import { addMinutes, addWeeks, addMonths } from "date-fns";
import { randomUUID } from "crypto";
import { checkAppointmentLimit, getPlanForBusiness } from "@/lib/subscription/enforcement";
import { PLAN_LIMITS } from "@/lib/subscription/config";
import { appUrl } from "@/lib/env";
import { runInBackground } from "@/lib/background";
import { normalisePhone, phoneLookupVariants } from "@/lib/phone";
import { createLogger } from "@/lib/logger";

const log = createLogger("appointments");

/** How long an unpaid booking holds its slot before the cleanup job frees it. */
const PENDING_PAYMENT_TTL_MINUTES = 15;

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `appointment:${ip}`, limit: 10, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 });
    }

    const body = await request.json();

    // Validate appointment data
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { serviceId, staffId, dateTime, notes, recurrenceFrequency, recurrenceCount } = parsed.data;
    const { couponCode, referralCode } = body;

    // Fetch service with business first (needed for businessId)
    const service = await db.service.findUnique({
      where: { id: serviceId },
      include: { business: { include: { settings: true } } },
    });

    if (!service || !service.isActive) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const business = service.business;
    const settings = business.settings;

    // Check appointment limit for business plan
    await checkAppointmentLimit(business.id);

    // Check auth session
    const session = await auth();
    const userId: string | null = session?.user?.id ?? null;
    let guestClientId: string | null = null;

    // If no session, validate guest info
    if (!userId) {
      const guestParsed = guestInfoSchema.safeParse(body.guest);
      if (!guestParsed.success) {
        return NextResponse.json({ error: "Datos del cliente inválidos", details: guestParsed.error.flatten() }, { status: 400 });
      }

      const guest = guestParsed.data;

      // Find or create guest client (scoped to business).
      // The lookup covers every shape the number may already be stored in;
      // new rows are written normalised so this stops growing over time.
      let guestClient = await db.guestClient.findFirst({
        where: {
          businessId: business.id,
          phone: { in: phoneLookupVariants(guest.phone) },
        },
      });

      if (!guestClient) {
        guestClient = await db.guestClient.create({
          data: {
            businessId: business.id,
            name: guest.name,
            phone: normalisePhone(guest.phone),
            email: guest.email,
          },
        });
      } else if (!guestClient.email) {
        // A row from before email was mandatory. Backfilling it here is what
        // lets that customer receive anything at all, including the code for
        // "mis turnos".
        guestClient = await db.guestClient.update({
          where: { id: guestClient.id },
          data: { email: guest.email },
        });
      }

      guestClientId = guestClient.id;
    }

    // Verify staff exists and belongs to this business
    const staff = await db.staffMember.findFirst({
      where: { id: staffId, businessId: business.id, isActive: true },
      select: { id: true, name: true, userId: true, googleCalendarEnabled: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // `dateTime` arrives in one of two shapes, and the difference matters:
    //
    //   "2026-08-31T09:00"           local time at the business (the wizard)
    //   "2026-08-31T12:00:00.000Z"   an absolute instant (what /availability/slots
    //                                returns, and what any integration would send)
    //
    // Both used to be read the same way — take the characters after the "T" and
    // match them against the slot's local label. Sending the API its own value
    // back therefore booked the appointment three hours late, silently.
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(dateTime);
    const [datePart, timePart] = dateTime.split("T");

    // With an explicit zone the calendar day is the one at the business, which
    // is not necessarily the UTC day: 2026-09-01T01:00Z is still 31 August here.
    const date = hasTimezone
      ? parseDateInArgentina(formatArgentinaDate(new Date(dateTime)))
      : parseDateInArgentina(datePart);

    // Before reading availability: an unpaid hold that already expired still
    // occupies the slot as far as the database constraint is concerned, so the
    // slot would read as free and every insert into it would fail with 409.
    await releaseExpiredHolds({ businessId: business.id });

    const slots = await getAvailableSlots({
      businessId: business.id,
      staffId,
      date,
      serviceDuration: service.duration,
      slotInterval: settings?.slotInterval ?? 30,
      minHoursAdvance: settings?.minAdvanceHours ?? 2,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    });

    const requestedInstant = hasTimezone ? new Date(dateTime).getTime() : null;
    const requestedTime = timePart?.substring(0, 5);

    const slot =
      requestedInstant !== null
        ? slots.find((s) => s.time.getTime() === requestedInstant)
        : slots.find((s) => s.display === requestedTime);

    if (!slot || !slot.available) {
      return NextResponse.json({ error: "El horario seleccionado ya no esta disponible" }, { status: 409 });
    }

    // Determine payment mode — enforce plan limits
    const effectivePlan = await getPlanForBusiness(business.id);
    const planLimits = PLAN_LIMITS[effectivePlan];
    const paymentMode = planLimits.mpPayments ? (settings?.paymentMode ?? "DISABLED") : "DISABLED";
    const initialStatus = paymentMode === "DISABLED" ? "CONFIRMED" : "PENDING_PAYMENT";

    // Handle recurring appointments (Feature 5)
    const isRecurring = recurrenceFrequency && recurrenceCount && recurrenceCount > 1 && paymentMode === "DISABLED";
    const recurrenceGroupId = isRecurring ? randomUUID() : null;

    // ------------------------------------------------------------------
    // Reads first. Everything the booking depends on is resolved before any
    // write, so the transaction below is short and write-only.
    // ------------------------------------------------------------------

    // Which recurring occurrences are actually free
    const recurringTimes: Date[] = [];
    if (isRecurring && recurrenceGroupId) {
      const addDateFn = recurrenceFrequency === "MONTHLY" ? addMonths
        : recurrenceFrequency === "BIWEEKLY" ? (d: Date, n: number) => addWeeks(d, n * 2)
        : addWeeks;

      for (let i = 1; i < recurrenceCount; i++) {
        const recurSlots = await getAvailableSlots({
          businessId: business.id,
          staffId,
          date: addDateFn(slot.time, i),
          serviceDuration: service.duration,
          slotInterval: settings?.slotInterval ?? 30,
          minHoursAdvance: 0, // Don't check advance for future recurring
          bufferMinutes: settings?.bufferMinutes ?? 0,
        });
        const recurSlot = recurSlots.find((s) => s.display === requestedTime);
        if (recurSlot?.available) {
          recurringTimes.push(recurSlot.time);
        }
      }
    }

    // Coupon, if the code matches an active one
    const coupon =
      couponCode && typeof couponCode === "string"
        ? await db.coupon.findFirst({
            where: {
              businessId: business.id,
              code: { equals: couponCode, mode: "insensitive" },
              isActive: true,
              validFrom: { lte: new Date() },
              OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
            },
          })
        : null;

    // Referral, if the code is valid, not self-referred and still redeemable
    let referral = null;
    if (referralCode && typeof referralCode === "string") {
      const found = await db.referral.findFirst({
        where: {
          businessId: business.id,
          code: { equals: referralCode, mode: "insensitive" },
        },
      });

      const isSelfReferral = Boolean(found?.userId && found.userId === userId);
      if (found && !isSelfReferral) {
        const maxRedemptions = settings?.referralMaxRedemptions;
        const redeemed = maxRedemptions
          ? await db.referralRedemption.count({ where: { referralId: found.id } })
          : 0;
        if (!maxRedemptions || redeemed < maxRedemptions) {
          referral = found;
        }
      }
    }

    // ------------------------------------------------------------------
    // One transaction for every write of the booking. If any step fails the
    // whole thing rolls back, instead of leaving a booking with a consumed
    // coupon or an orphan payment behind.
    // ------------------------------------------------------------------
    const { appointment, recurringIds, payment } = await db.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          businessId: business.id,
          serviceId,
          staffId,
          userId,
          guestClientId,
          dateTime: slot.time,
          endTime: addMinutes(slot.time, service.duration),
          status: initialStatus,
          // An unpaid booking must not hold the slot forever.
          expiresAt:
            initialStatus === "PENDING_PAYMENT"
              ? addMinutes(new Date(), PENDING_PAYMENT_TTL_MINUTES)
              : null,
          notes: notes || null,
          recurrenceGroupId,
          recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
          recurrenceCount: isRecurring ? recurrenceCount : null,
          recurrenceIndex: isRecurring ? 0 : null,
        },
      });

      const recurringIds: string[] = [];
      for (const [index, time] of recurringTimes.entries()) {
        const sibling = await tx.appointment.create({
          data: {
            businessId: business.id,
            serviceId,
            staffId,
            userId,
            guestClientId,
            dateTime: time,
            endTime: addMinutes(time, service.duration),
            status: "CONFIRMED",
            notes: notes || null,
            recurrenceGroupId,
            recurrenceFrequency,
            recurrenceCount,
            recurrenceIndex: index + 1,
          },
        });
        recurringIds.push(sibling.id);
      }

      // Claim one coupon use atomically: the condition travels with the UPDATE,
      // so two simultaneous redemptions can't both push usedCount past maxUses.
      let couponDiscount = 0;
      if (coupon) {
        const claimed = await tx.coupon.updateMany({
          where: {
            id: coupon.id,
            ...(coupon.maxUses ? { usedCount: { lt: coupon.maxUses } } : {}),
          },
          data: { usedCount: { increment: 1 } },
        });

        if (claimed.count > 0) {
          couponDiscount = calculateCouponDiscount(Number(service.price), coupon);
          await tx.couponRedemption.create({
            data: {
              couponId: coupon.id,
              appointmentId: appointment.id,
              userId,
              guestClientId,
              discount: couponDiscount,
            },
          });
        }
      }

      if (referral) {
        await tx.referralRedemption.create({
          data: {
            referralId: referral.id,
            appointmentId: appointment.id,
            referredUserId: userId,
            referredGuestId: guestClientId,
          },
        });

        // Reward coupon for the referrer, if the program is configured
        if (settings?.referralEnabled && settings.referralRewardType && settings.referralRewardValue) {
          await tx.coupon.create({
            data: {
              businessId: business.id,
              code: `REF-${referral.code}-${randomUUID().slice(0, 8).toUpperCase()}`,
              type: settings.referralRewardType,
              value: settings.referralRewardValue,
              maxUses: 1,
              validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            },
          });
        }
      }

      // The amount is computed here, after knowing whether the coupon was really
      // claimed — otherwise a coupon that ran out between read and write would
      // still discount the charge.
      let payment = null;
      if (paymentMode !== "DISABLED") {
        payment = await tx.payment.create({
          data: {
            businessId: business.id,
            appointmentId: appointment.id,
            amount: calculatePaymentAmount(
              applyDiscount(Number(service.price), couponDiscount),
              paymentMode as "FULL" | "PERCENTAGE" | "FIXED",
              settings?.depositPercentage,
              settings?.depositFixedAmount ? Number(settings.depositFixedAmount) : null
            ),
            mode: paymentMode,
            status: "PENDING",
          },
        });
      }

      return { appointment, recurringIds, payment };
    });

    // Handle payment if enabled
    let paymentUrl: string | null = null;

    if (payment) {
      const amount = Number(payment.amount);

      // Create MercadoPago preference
      try {
        const mp = getMPClient(await getBusinessMPToken(business.id));
        const preference = await mp.preference.create({
          body: {
            items: [
              {
                id: appointment.id,
                title: `${service.name} - ${business.name}`,
                quantity: 1,
                unit_price: amount,
                currency_id: "ARS",
              },
            ],
            back_urls: {
              success: appUrl(`/${business.slug}/reservar/confirmacion?appointmentId=${appointment.id}`),
              failure: appUrl(`/${business.slug}/reservar?error=payment`),
              pending: appUrl(`/${business.slug}/reservar/confirmacion?appointmentId=${appointment.id}&pending=true`),
            },
            external_reference: appointment.id,
            notification_url: appUrl(`/api/webhooks/mercadopago`),
          },
        });

        paymentUrl = preference.init_point ?? null;

        await db.payment.update({
          where: { id: payment.id },
          data: { mpPreferenceId: preference.id },
        });
      } catch (mpError) {
        log.error("could not create the payment preference", mpError, { appointmentId: appointment.id });
        // Still create appointment, payment can be retried
      }
    }

    // Send notifications (fire and forget)
    const clientName = userId
      ? session?.user?.name ?? "Cliente"
      : body.guest?.name ?? "Cliente";
    const clientEmail = userId ? session?.user?.email ?? undefined : body.guest?.email;

    runInBackground("confirmation-notice", () =>
      sendNotification({
        businessId: business.id,
        businessName: business.name,
        appointmentId: appointment.id,
        clientName,
        clientEmail: clientEmail ?? undefined,
        serviceName: service.name,
        staffName: staff.name,
        dateTime: slot.time,
        type: "confirmation",
      }), { appointmentId: appointment.id });

    // Google Calendar sync
    if (staff.googleCalendarEnabled && staff.userId) {
      runInBackground("calendar-create", async () => {
        const { createCalendarEvent } = await import("@/lib/google-calendar");
        const eventId = await createCalendarEvent(staff.userId!, {
          title: `${clientName} - ${service.name}`,
          startTime: slot.time,
          endTime: addMinutes(slot.time, service.duration),
          description: notes || undefined,
        });
        if (eventId) {
          await db.appointment.update({
            where: { id: appointment.id },
            data: { googleCalendarEventId: eventId },
          });
        }
      }, { appointmentId: appointment.id });
    }

    // Audit log
    await logAction({
      businessId: business.id,
      userId,
      action: "CREATE",
      entity: "Appointment",
      entityId: appointment.id,
      details: {
        serviceId,
        staffId,
        dateTime: slot.time.toISOString(),
        guestClientId,
        paymentMode,
      },
    });

    return NextResponse.json({
      id: appointment.id,
      status: appointment.status,
      dateTime: appointment.dateTime,
      paymentUrl,
      ...(recurringIds.length > 0 && {
        recurringCount: recurringIds.length + 1,
        recurringIds: [appointment.id, ...recurringIds],
      }),
    }, { status: 201 });
  } catch (error) {
    // handleApiError maps PlanLimitError to 403 + requiredPlan (the upsell moment),
    // and still hides unexpected errors behind a generic message.
    return handleApiError(error, "appointments:POST");
  }
}
