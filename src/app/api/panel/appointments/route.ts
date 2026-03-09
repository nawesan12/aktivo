import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { startOfDay, endOfDay } from "date-fns";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "appointments:read");

    const { searchParams } = request.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const status = searchParams.get("status");
    const staffId = searchParams.get("staffId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {
      businessId: session.businessId,
    };

    if (status) {
      const statuses = status.split(",");
      where.status = { in: statuses };
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

    return NextResponse.json({
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
        dateTime: a.dateTime,
        endTime: a.endTime,
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
    });
  } catch (error) {
    return handleApiError(error);
  }
}
