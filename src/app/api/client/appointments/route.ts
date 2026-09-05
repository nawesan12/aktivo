import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { handleApiError } from "@/lib/api-errors";
import { clientAppointmentWhere, resolveClientIdentity } from "@/lib/client-identity";

/**
 * A customer's appointments, across every shop they have booked at.
 *
 * Serves both halves of the portal: the signed-in account page and the
 * code-verified one. The identity — not the session — decides what is visible,
 * which is what lets a booking made as a guest and one made with an account sit
 * in the same list.
 */
export async function GET(request: Request) {
  try {
    const identity = await resolveClientIdentity();
    if (!identity) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");
    const scope = searchParams.get("scope");

    const identityWhere = clientAppointmentWhere(identity);
    const where: Prisma.AppointmentWhereInput = { AND: [identityWhere] };

    /*
      "Upcoming" is what the portal opens on, and it is not just a date filter:
      a cancelled booking for next Tuesday is not something you are about to
      attend. Everything else — past dates, and anything closed — is history.
    */
    const now = new Date();
    const live: Prisma.EnumAppointmentStatusFilter = {
      in: ["PENDING_PAYMENT", "PENDING", "CONFIRMED"],
    };
    if (scope === "upcoming") {
      where.dateTime = { gte: now };
      where.status = live;
    } else if (scope === "past") {
      where.OR = [
        { dateTime: { lt: now } },
        { status: { in: ["COMPLETED", "CANCELLED", "NO_SHOW"] } },
      ];
      /*
        The half of a reschedule that was replaced does not belong in a history.

        Moving an appointment cancels the old row and writes a new one pointing
        back at it, so the customer who just changed their time was shown a
        "Cancelado" for the slot they had picked — reading, reasonably, as if
        the shop had cancelled on them.
      */
      where.rescheduledTo = { none: {} };
    }

    if (status) {
      where.status = status as Prisma.EnumAppointmentStatusFilter;
    }
    if (from) {
      where.dateTime = { ...((where.dateTime as Prisma.DateTimeFilter) || {}), gte: new Date(from) };
    }
    if (to) {
      where.dateTime = { ...((where.dateTime as Prisma.DateTimeFilter) || {}), lte: new Date(to) };
    }
    if (search) {
      // Pushed onto the same AND as the identity. Assigning `where.OR` here
      // would collide with the one `scope=past` writes, and either way it would
      // sit beside the identity rather than inside it — widening the list to
      // every appointment matching the text, from every customer.
      (where.AND as Prisma.AppointmentWhereInput[]).push({
        OR: [
          { service: { name: { contains: search, mode: "insensitive" } } },
          { staff: { name: { contains: search, mode: "insensitive" } } },
          { business: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        orderBy: { dateTime: scope === "upcoming" ? "asc" : "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          dateTime: true,
          status: true,
          notes: true,
          serviceId: true,
          staffId: true,
          service: { select: { id: true, name: true, duration: true, price: true } },
          staff: { select: { id: true, name: true } },
          business: {
            select: { name: true, slug: true, logo: true, address: true, phone: true },
          },
          payment: { select: { status: true, amount: true } },
        },
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({
      data: appointments,
      identity: { email: identity.email, name: identity.name, via: identity.via },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "client:appointments");
  }
}
