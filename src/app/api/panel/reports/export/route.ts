import { NextResponse } from "next/server";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "reports:export");

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "appointments";

    const today = format(new Date(), "yyyy-MM-dd");

    if (type === "appointments") {
      const appointments = await db.appointment.findMany({
        where: { businessId: session.businessId },
        orderBy: { dateTime: "desc" },
        take: 5000,
        select: {
          dateTime: true,
          status: true,
          notes: true,
          user: { select: { name: true, email: true } },
          guestClient: { select: { name: true, phone: true } },
          service: { select: { name: true, price: true } },
          staff: { select: { name: true } },
          payment: { select: { status: true, amount: true } },
        },
      });

      const header = "Fecha,Hora,Cliente,Email,Servicio,Profesional,Estado,Pago,Monto";
      const rows = appointments.map((a) => {
        const date = format(a.dateTime, "yyyy-MM-dd");
        const time = format(a.dateTime, "HH:mm");
        const client = (a.user?.name || a.guestClient?.name || "").replace(/,/g, " ");
        const email = (a.user?.email || "").replace(/,/g, " ");
        const service = a.service.name.replace(/,/g, " ");
        const staff = a.staff.name.replace(/,/g, " ");
        const payStatus = a.payment?.status || "-";
        const amount = a.payment?.amount?.toString() || "0";
        return `${date},${time},${client},${email},${service},${staff},${a.status},${payStatus},${amount}`;
      });

      const csv = [header, ...rows].join("\n");

      await logAction({
        businessId: session.businessId,
        userId: session.userId,
        action: "reports:export",
        entity: "appointments",
        details: { type, count: appointments.length },
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="turnos_${today}.csv"`,
        },
      });
    }

    if (type === "clients") {
      const clients = await db.appointment.findMany({
        where: { businessId: session.businessId, userId: { not: null } },
        distinct: ["userId"],
        take: 5000,
        select: {
          user: { select: { name: true, email: true, phone: true } },
        },
      });

      const guestClients = await db.guestClient.findMany({
        where: { businessId: session.businessId },
        take: 5000,
        select: { name: true, phone: true, email: true },
      });

      const header = "Nombre,Email,Telefono";
      const rows = [
        ...clients.map((c) => {
          const name = (c.user?.name || "").replace(/,/g, " ");
          const email = (c.user?.email || "").replace(/,/g, " ");
          const phone = (c.user?.phone || "").replace(/,/g, " ");
          return `${name},${email},${phone}`;
        }),
        ...guestClients.map((g) => {
          const name = (g.name || "").replace(/,/g, " ");
          const email = (g.email || "").replace(/,/g, " ");
          const phone = (g.phone || "").replace(/,/g, " ");
          return `${name},${email},${phone}`;
        }),
      ];

      const csv = [header, ...rows].join("\n");

      await logAction({
        businessId: session.businessId,
        userId: session.userId,
        action: "reports:export",
        entity: "clients",
        details: { type, count: rows.length },
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="clientes_${today}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error interno";
    const status = msg.includes("No autenticado") ? 401 : msg.includes("Permisos") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
