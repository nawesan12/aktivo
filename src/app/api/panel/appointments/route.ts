import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { addMinutes } from "date-fns";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { handleApiError, NotFoundError, SlotTakenError } from "@/lib/api-errors";
import { listAppointments } from "@/lib/panel/appointments";
import { runInBackground } from "@/lib/background";
import { maybeTick } from "@/lib/jobs/tick";
import { getAvailableSlots, getAnyStaffSlots, findFreeStaff } from "@/lib/availability";
import { releaseExpiredHolds } from "@/lib/bookings/expiry";
import { parseDateInArgentina } from "@/lib/timezone";
import { checkAppointmentLimit } from "@/lib/subscription/enforcement";
import { normalisePhone, phoneLookupVariants } from "@/lib/phone";
import { sendNotification } from "@/lib/notifications";
import { logAction } from "@/lib/audit";
import { getActiveMembership, spendVisit } from "@/lib/memberships";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:read");

    const { searchParams } = request.nextUrl;

    const result = await listAppointments(session.businessId, {
      page: parseInt(searchParams.get("page") || "1"),
      pageSize: parseInt(searchParams.get("pageSize") || "20"),
      status: searchParams.get("status"),
      staffId: searchParams.get("staffId"),
      dateFrom: searchParams.get("dateFrom"),
      dateTo: searchParams.get("dateTo"),
      search: searchParams.get("search"),
    });

    // Real traffic is what drives the background jobs on the free plan: no
    // Vercel cron can run more than once a day there. See `src/lib/jobs/tick.ts`.
    runInBackground("tick", maybeTick);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "panel:appointments");
  }
}

/**
 * A turno the business takes itself: a walk-in, or a client who phoned.
 *
 * There was no way to do this at all — `/api/panel/appointments` only had a
 * GET. Every appointment had to come through the public booking page, so a
 * barbershop taking a call had to open its own site and book as if it were the
 * customer, email address and all. The agenda in the panel was a window, not a
 * desk.
 *
 * Deliberately simpler than the public booking: always CONFIRMED and never
 * charged. The owner is standing in front of the person or on the phone with
 * them; a deposit link makes no sense there, and they will take the money the
 * way they always have.
 */
const panelAppointmentSchema = z
  .object({
    serviceId: z.string().min(1, "Elegí un servicio"),
    /** "any" lets the system pick whoever is genuinely free. */
    staffId: z.string().min(1, "Elegí un profesional"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    notes: z.string().trim().max(500).optional(),
    /** An existing client of this business… */
    guestClientId: z.string().optional(),
    /** …or a new one, entered on the spot. */
    name: z.string().trim().min(2, "Escribí el nombre del cliente").optional(),
    phone: z.string().trim().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
  })
  .refine((data) => data.guestClientId || data.name, {
    message: "Elegí un cliente o escribí su nombre",
    path: ["name"],
  });

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:create");

    const input = panelAppointmentSchema.parse(await request.json());

    // The monthly cap is the business's own plan limit, and here the person
    // hitting it *is* the owner — so unlike the public route, they get told.
    await checkAppointmentLimit(session.businessId);

    const service = await db.service.findFirst({
      where: { id: input.serviceId, businessId: session.businessId, isActive: true },
      include: { business: { include: { settings: true } } },
    });

    if (!service) throw new NotFoundError("Servicio no encontrado");

    const business = service.business;
    const settings = business.settings;

    const wantsAnyStaff = input.staffId === "any";
    const staff = wantsAnyStaff
      ? null
      : await db.staffMember.findFirst({
          where: { id: input.staffId, businessId: session.businessId, isActive: true },
          select: { id: true, name: true, userId: true, googleCalendarEnabled: true },
        });

    if (!wantsAnyStaff && !staff) throw new NotFoundError("Profesional no encontrado");

    // Midnight at the business, not UTC: `new Date("2026-09-04")` is the day
    // before in Argentina.
    const date = parseDateInArgentina(input.date);

    // An expired unpaid hold still blocks the slot as far as the database
    // constraint is concerned, so without this the slot reads as free and the
    // insert fails with a 409 nobody can explain.
    await releaseExpiredHolds({ businessId: session.businessId });

    const slotOptions = {
      businessId: session.businessId,
      date,
      serviceDuration: service.duration,
      slotInterval: settings?.slotInterval ?? 30,
      // The owner books into their own agenda: the notice period exists to stop
      // a customer booking for five minutes from now, not to stop the barber
      // writing down the person already sitting in the chair.
      minHoursAdvance: 0,
      bufferMinutes: settings?.bufferMinutes ?? 0,
    };

    const slots = wantsAnyStaff
      ? await getAnyStaffSlots({ ...slotOptions, serviceId: input.serviceId })
      : await getAvailableSlots({ ...slotOptions, staffId: input.staffId });

    const slot = slots.find((s) => s.display === input.time);
    if (!slot || !slot.available) throw new SlotTakenError();

    const assignedStaff = wantsAnyStaff
      ? await findFreeStaff({
          businessId: session.businessId,
          serviceId: input.serviceId,
          instant: slot.time,
          options: slotOptions,
        })
      : staff;

    if (!assignedStaff) throw new SlotTakenError();

    // The client: an existing one by id, or found/created from the phone. The
    // lookup covers every shape the number may already be stored in, so the
    // owner does not end up with two rows for the same person.
    let guestClient = input.guestClientId
      ? await db.guestClient.findFirst({
          where: { id: input.guestClientId, businessId: session.businessId },
        })
      : input.phone
        ? await db.guestClient.findFirst({
            where: {
              businessId: session.businessId,
              phone: { in: phoneLookupVariants(input.phone) },
            },
          })
        : null;

    if (!guestClient) {
      guestClient = await db.guestClient.create({
        data: {
          businessId: session.businessId,
          name: input.name!,
          // A walk-in may not want to leave a number, and refusing the booking
          // over it would send them back to pen and paper. Null rather than "",
          // or the unique on (businessId, phone) allows only one of them.
          phone: input.phone ? normalisePhone(input.phone) : null,
          email: input.email || null,
        },
      });
    } else if (input.email && !guestClient.email) {
      guestClient = await db.guestClient.update({
        where: { id: guestClient.id },
        data: { email: input.email },
      });
    }

    // Does this person have visits on an abono? Read before the transaction so
    // the write below stays short; the balance is re-checked inside it, which
    // is what decides the last visit when two bookings arrive together.
    const membership = await getActiveMembership(session.businessId, {
      guestClientId: guestClient.id,
    });

    // The write, on its own, so the exclusion constraint has the last word: if
    // someone booked this slot online a second ago, this insert loses and
    // `handleApiError` turns it into the same 409 the wizard shows.
    const { appointment, usedMembership } = await db.$transaction(async (tx) => {
      const created = await tx.appointment.create({
        data: {
          businessId: session.businessId,
          serviceId: input.serviceId,
          staffId: assignedStaff.id,
          guestClientId: guestClient.id,
          dateTime: slot.time,
          endTime: addMinutes(slot.time, service.duration),
          status: "CONFIRMED",
          notes: input.notes || null,
          // Booked for later today: the confirmation says the same thing, so a
          // reminder would be noise.
          reminder24hSentAt:
            slot.time.getTime() - Date.now() < 25 * 60 * 60 * 1000 ? new Date() : null,
        },
      });

      if (!membership || membership.remaining < 1) {
        return { appointment: created, usedMembership: false };
      }

      const spent = await spendVisit(tx, {
        businessId: session.businessId,
        membershipId: membership.membershipId,
        appointmentId: created.id,
      });

      if (spent) {
        await tx.appointment.update({
          where: { id: created.id },
          data: { membershipId: membership.membershipId },
        });
      }

      return { appointment: created, usedMembership: spent };
    });

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "appointment.create",
      entity: "Appointment",
      entityId: appointment.id,
      details: { source: "panel", clientName: guestClient.name },
    });

    if (guestClient.email) {
      runInBackground(
        "panel-confirmation",
        () =>
          sendNotification({
            businessId: session.businessId,
            businessName: business.name,
            businessSlug: business.slug,
            appointmentId: appointment.id,
            clientName: guestClient.name,
            clientEmail: guestClient.email ?? undefined,
            serviceName: service.name,
            staffName: assignedStaff.name,
            dateTime: slot.time,
            type: "confirmation",
          }),
        { appointmentId: appointment.id }
      );
    }

    return NextResponse.json(
      {
        id: appointment.id,
        staffName: assignedStaff.name,
        clientName: guestClient.name,
        // Whether the visit came off an abono, so the panel can say so instead
        // of the owner charging someone who already paid for the month.
        usedMembership,
        membershipRemaining: usedMembership && membership ? membership.remaining - 1 : null,
        // Said back so the panel can tell the owner whether the client will
        // hear about it, instead of implying an email that never goes out.
        notified: Boolean(guestClient.email),
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, "panel:appointments:POST");
  }
}
