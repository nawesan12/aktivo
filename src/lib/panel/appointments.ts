import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "date-fns";
import type { AppointmentStatus, Prisma } from "@/generated/prisma/client";

/**
 * The panel's appointment list.
 *
 * Extracted from the route handler so `/panel/turnos` can render its first page
 * on the server. Dates are serialised here so both callers — the server render
 * and the JSON response — hand the components exactly the same shape.
 */

export interface AppointmentListFilters {
  page?: number;
  pageSize?: number;
  status?: string | null;
  staffId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  search?: string | null;
}

export async function listAppointments(
  businessId: string,
  {
    page = 1,
    pageSize = 20,
    status,
    staffId,
    dateFrom,
    dateTo,
    search,
  }: AppointmentListFilters = {}
) {
  const where: Prisma.AppointmentWhereInput = { businessId };

  if (status) {
    where.status = { in: status.split(",") as AppointmentStatus[] };
  }

  if (staffId) where.staffId = staffId;

  if (dateFrom || dateTo) {
    where.dateTime = {
      ...(dateFrom ? { gte: startOfDay(new Date(dateFrom)) } : {}),
      ...(dateTo ? { lte: endOfDay(new Date(dateTo)) } : {}),
    };
  }

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { guestClient: { name: { contains: search, mode: "insensitive" } } },
      { guestClient: { phone: { contains: search } } },
    ];
  }

  const [appointments, total] = await Promise.all([
    db.appointment.findMany({
      where,
      orderBy: { dateTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        service: { select: { name: true, duration: true, price: true } },
        staff: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true, phone: true } },
        guestClient: { select: { id: true, name: true, phone: true, email: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    db.appointment.count({ where }),
  ]);

  return {
    data: appointments.map((a) => ({
      id: a.id,
      clientName: a.user?.name || a.guestClient?.name || "Sin nombre",
      clientEmail: a.user?.email || a.guestClient?.email,
      clientPhone: a.user?.phone || a.guestClient?.phone,
      clientType: a.userId ? "registered" : "guest",
      serviceName: a.service.name,
      serviceDuration: a.service.duration,
      servicePrice: a.service.price,
      staffId: a.staff.id,
      staffName: a.staff.name,
      dateTime: a.dateTime.toISOString(),
      endTime: a.endTime.toISOString(),
      status: a.status,
      notes: a.notes,
      paymentStatus: a.payment?.status || null,
      paymentAmount: a.payment?.amount || null,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

export type AppointmentListPage = Awaited<ReturnType<typeof listAppointments>>;

/** The querystring the client uses, so SSR and SWR share one cache key. */
export function appointmentListKey({
  page = 1,
  pageSize = 20,
  status,
  staffId,
  dateFrom,
  dateTo,
  search,
}: AppointmentListFilters = {}): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  if (staffId) params.set("staffId", staffId);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (search) params.set("search", search);
  return `/api/panel/appointments?${params}`;
}
