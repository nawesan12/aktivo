import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { logAction } from "@/lib/audit";
import { sendNotification } from "@/lib/notifications";
import { getMPClient, calculatePaymentAmount } from "@/lib/mercadopago";
import { appointmentSchema, guestInfoSchema } from "@/lib/validations";
import { getAvailableSlots } from "@/lib/availability";
import { parseDateInArgentina } from "@/lib/timezone";
import { addMinutes, addWeeks, addMonths } from "date-fns";
import { randomUUID } from "crypto";
import { checkAppointmentLimit, getPlanForBusiness } from "@/lib/subscription/enforcement";
import { PLAN_LIMITS } from "@/lib/subscription/config";

export async function POST(request: Request) {
  try {
    // Rate limit
    const ip = getClientIP(request);
    const { success } = rateLimit({ key: `appointment:${ip}`, limit: 10, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, { status: 429 });
    }

    const body = await request.json();

    // Validate appointment data
    const parsed = appointmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos invalidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { serviceId, staffId, dateTime, notes, recurrenceFrequency, recurrenceCount } = parsed.data;

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
    let userId: string | null = session?.user?.id ?? null;
    let guestClientId: string | null = null;

    // If no session, validate guest info
    if (!userId) {
      const guestParsed = guestInfoSchema.safeParse(body.guest);
      if (!guestParsed.success) {
        return NextResponse.json({ error: "Datos del cliente invalidos", details: guestParsed.error.flatten() }, { status: 400 });
      }

      const guest = guestParsed.data;

      // Find or create guest client (scoped to business)
      let guestClient = await db.guestClient.findUnique({
        where: { businessId_phone: { businessId: business.id, phone: guest.phone } },
      });

      if (!guestClient) {
        guestClient = await db.guestClient.create({
          data: {
            businessId: business.id,
            name: guest.name,
            phone: guest.phone,
            email: guest.email || null,
          },
        });
      }

      guestClientId = guestClient.id;
    }

    // Verify staff exists and belongs to this business
    const staff = await db.staffMember.findFirst({
      where: { id: staffId, businessId: business.id, isActive: true },
      select: { id: true, name: true, userId: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // Parse date and check slot availability (conflict check)
    const [datePart, timePart] = dateTime.split("T");
    const date = parseDateInArgentina(datePart);

    const slots = await getAvailableSlots({
      businessId: business.id,
      staffId,
      date,
      serviceDuration: service.duration,
      slotInterval: settings?.slotInterval ?? 30,
      minHoursAdvance: settings?.minAdvanceHours ?? 2,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    });

    const requestedTime = timePart?.substring(0, 5);
    const slot = slots.find((s) => s.display === requestedTime);

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

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId,
        userId,
        guestClientId,
        dateTime: slot.time,
        endTime: addMinutes(slot.time, service.duration),
        status: initialStatus,
        notes: notes || null,
        recurrenceGroupId,
        recurrenceFrequency: isRecurring ? recurrenceFrequency : null,
        recurrenceCount: isRecurring ? recurrenceCount : null,
        recurrenceIndex: isRecurring ? 0 : null,
      },
    });

    // Create recurring sibling appointments
    const recurringAppointments: string[] = [];
    if (isRecurring && recurrenceGroupId) {
      const addDateFn = recurrenceFrequency === "MONTHLY" ? addMonths
        : recurrenceFrequency === "BIWEEKLY" ? (d: Date, n: number) => addWeeks(d, n * 2)
        : addWeeks;

      for (let i = 1; i < recurrenceCount; i++) {
        const recurDate = addDateFn(slot.time, i);
        try {
          const recurSlots = await getAvailableSlots({
            businessId: business.id,
            staffId,
            date: recurDate,
            serviceDuration: service.duration,
            slotInterval: settings?.slotInterval ?? 30,
            minHoursAdvance: 0, // Don't check advance for future recurring
            bufferMinutes: settings?.bufferMinutes ?? 0,
          });
          const recurSlot = recurSlots.find((s) => s.display === requestedTime);
          if (recurSlot?.available) {
            const recApt = await db.appointment.create({
              data: {
                businessId: business.id,
                serviceId,
                staffId,
                userId,
                guestClientId,
                dateTime: recurSlot.time,
                endTime: addMinutes(recurSlot.time, service.duration),
                status: "CONFIRMED",
                notes: notes || null,
                recurrenceGroupId,
                recurrenceFrequency,
                recurrenceCount,
                recurrenceIndex: i,
              },
            });
            recurringAppointments.push(recApt.id);
          }
        } catch {
          // Skip unavailable dates
        }
      }
    }

    // Handle payment if enabled
    let paymentUrl: string | null = null;

    if (paymentMode !== "DISABLED") {
      const amount = calculatePaymentAmount(
        Number(service.price),
        paymentMode as "FULL" | "PERCENTAGE" | "FIXED",
        settings?.depositPercentage,
        settings?.depositFixedAmount ? Number(settings.depositFixedAmount) : null
      );

      // Create payment record
      const payment = await db.payment.create({
        data: {
          businessId: business.id,
          appointmentId: appointment.id,
          amount,
          mode: paymentMode,
          status: "PENDING",
        },
      });

      // Get business-specific MP token if available
      const mpConfig = await db.businessConfig.findUnique({
        where: {
          businessId_key: {
            businessId: business.id,
            key: "mp_access_token",
          },
        },
      });

      // Create MercadoPago preference
      try {
        const mp = getMPClient(mpConfig?.value ?? undefined);
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
              success: `${process.env.NEXT_PUBLIC_APP_URL}/${business.slug}/reservar/confirmacion?appointmentId=${appointment.id}`,
              failure: `${process.env.NEXT_PUBLIC_APP_URL}/${business.slug}/reservar?error=payment`,
              pending: `${process.env.NEXT_PUBLIC_APP_URL}/${business.slug}/reservar/confirmacion?appointmentId=${appointment.id}&pending=true`,
            },
            external_reference: appointment.id,
            notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
          },
        });

        paymentUrl = preference.init_point ?? null;

        await db.payment.update({
          where: { id: payment.id },
          data: { mpPreferenceId: preference.id },
        });
      } catch (mpError) {
        console.error("MercadoPago error:", mpError);
        // Still create appointment, payment can be retried
      }
    }

    // Send notifications (fire and forget)
    const clientName = userId
      ? session?.user?.name ?? "Cliente"
      : body.guest?.name ?? "Cliente";
    const clientPhone = userId ? undefined : body.guest?.phone;
    const clientEmail = userId ? session?.user?.email ?? undefined : body.guest?.email;

    sendNotification({
      businessId: business.id,
      businessName: business.name,
      appointmentId: appointment.id,
      clientName,
      clientPhone,
      clientEmail: clientEmail ?? undefined,
      serviceName: service.name,
      staffName: staff.name,
      dateTime: slot.time,
      type: "confirmation",
    }).catch((err) => console.error("Notification error:", err));

    // Google Calendar sync (Feature 6) — temporarily disabled
    // TODO: re-enable once googleCalendarEnabled field is migrated
    // if (staff.googleCalendarEnabled && staff.userId) { ... }

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
      ...(recurringAppointments.length > 0 && {
        recurringCount: recurringAppointments.length + 1,
        recurringIds: [appointment.id, ...recurringAppointments],
      }),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
