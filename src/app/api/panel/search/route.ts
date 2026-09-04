import { NextResponse } from "next/server";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { formatCurrency } from "@/lib/format";

export async function GET(request: Request) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "appointments:read");

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const type = searchParams.get("type") || "all";

    if (q.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: Array<{ type: string; id: string; label: string; sublabel: string; href: string }> = [];

    if (type === "all" || type === "appointments") {
      const appointments = await db.appointment.findMany({
        where: {
          businessId: session.businessId,
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { guestClient: { name: { contains: q, mode: "insensitive" } } },
            { service: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 5,
        orderBy: { dateTime: "desc" },
        select: {
          id: true,
          dateTime: true,
          user: { select: { name: true } },
          guestClient: { select: { name: true } },
          service: { select: { name: true } },
        },
      });
      for (const a of appointments) {
        results.push({
          type: "appointment",
          id: a.id,
          label: a.user?.name || a.guestClient?.name || "Sin nombre",
          sublabel: a.service.name,
          href: `/panel/turnos`,
        });
      }
    }

    if (type === "all" || type === "clients") {
      const users = await db.appointment.findMany({
        where: {
          businessId: session.businessId,
          user: { name: { contains: q, mode: "insensitive" } },
        },
        take: 5,
        distinct: ["userId"],
        select: { user: { select: { id: true, name: true, email: true } } },
      });
      for (const a of users) {
        if (a.user) {
          results.push({
            type: "client",
            id: a.user.id,
            label: a.user.name || "Sin nombre",
            sublabel: a.user.email || "",
            href: `/panel/clientes`,
          });
        }
      }
    }

    if (type === "all" || type === "services") {
      const services = await db.service.findMany({
        where: { businessId: session.businessId, name: { contains: q, mode: "insensitive" } },
        take: 5,
        select: { id: true, name: true, price: true },
      });
      for (const s of services) {
        results.push({
          type: "service",
          id: s.id,
          label: s.name,
          sublabel: `${formatCurrency(s.price)}`,
          href: `/panel/servicios`,
        });
      }
    }

    if (type === "all" || type === "staff") {
      const staff = await db.staffMember.findMany({
        where: {
          businessId: session.businessId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { specialty: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        select: { id: true, name: true, specialty: true },
      });
      for (const s of staff) {
        results.push({
          type: "staff",
          id: s.id,
          label: s.name,
          sublabel: s.specialty || "",
          href: `/panel/equipo`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
