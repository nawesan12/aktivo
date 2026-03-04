import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

    const [appointments, total] = await Promise.all([
      db.appointment.findMany({
        where: { userId: session.user.id },
        orderBy: { dateTime: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          dateTime: true,
          status: true,
          notes: true,
          service: { select: { name: true, duration: true, price: true } },
          staff: { select: { name: true } },
          business: { select: { name: true, slug: true } },
          payment: { select: { status: true, amount: true } },
        },
      }),
      db.appointment.count({ where: { userId: session.user.id } }),
    ]);

    return NextResponse.json({
      data: appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Account appointments error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
