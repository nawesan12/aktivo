import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { handleApiError } from "@/lib/api-errors";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
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

    const where: Prisma.AppointmentWhereInput = { userId: session.user.id };

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
      where.OR = [
        { service: { name: { contains: search, mode: "insensitive" } } },
        { staff: { name: { contains: search, mode: "insensitive" } } },
        { business: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where,
        orderBy: { dateTime: "desc" },
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
          business: { select: { name: true, slug: true } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      db.appointment.count({ where }),
    ]);

    return NextResponse.json({
      data: appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error, "account:appointments");
  }
}
