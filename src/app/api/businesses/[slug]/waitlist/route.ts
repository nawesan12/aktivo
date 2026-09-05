import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit, getClientIP } from "@/lib/rate-limit";
import { guestClientForBusiness, resolveClientIdentity } from "@/lib/client-identity";
import { isValidArgentinePhone, normalisePhone, phoneLookupVariants } from "@/lib/phone";
import { addDays } from "date-fns";
import { handleApiError } from "@/lib/api-errors";
import { createLogger } from "@/lib/logger";

const log = createLogger("businesses:waitlist");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const identity = await resolveClientIdentity();
    if (!identity) {
      return NextResponse.json({ entries: [] });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ entries: [] });
    }

    // Waitlist rows are keyed by phone, so the customer's number has to come
    // from somewhere: their guest row at this shop, or their own profile.
    const guestClient = await guestClientForBusiness(identity, business.id);
    const phones = await db.guestClient
      .findFirst({ where: { id: guestClient?.id ?? "" }, select: { phone: true } })
      .then(async (row) => {
        if (row?.phone) return phoneLookupVariants(row.phone);
        if (!identity.userId) return [];
        const user = await db.user.findUnique({
          where: { id: identity.userId },
          select: { phone: true },
        });
        return user?.phone ? phoneLookupVariants(user.phone) : [];
      });

    if (phones.length === 0) {
      return NextResponse.json({ entries: [] });
    }

    const entries = await db.waitlistEntry.findMany({
      where: {
        businessId: business.id,
        phone: { in: phones },
        expiresAt: { gt: new Date() },
      },
      include: {
        service: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ entries });
  } catch (error) {
    log.error("could not list waitlist entries", error);
    return NextResponse.json({ entries: [] });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const ip = getClientIP(request);
    const { success } = await rateLimit({ key: `waitlist:${ip}`, limit: 5, windowMs: 60_000 });
    if (!success) {
      return NextResponse.json({ error: "Demasiados intentos." }, { status: 429 });
    }

    const { slug } = await params;
    const { name, phone, email, serviceId, staffId, preferredDate } = await request.json();

    if (!name || !phone || !serviceId || !preferredDate) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // `phone.length < 10` on the raw string accepted "0000000000" and rejected
    // "+54 9 223 632-7551", which is how a lot of people type it.
    if (typeof phone !== "string" || !isValidArgentinePhone(phone)) {
      return NextResponse.json({ error: "Teléfono argentino inválido" }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    // Check if service exists
    const service = await db.service.findFirst({
      where: { id: serviceId, businessId: business.id, isActive: true },
    });

    if (!service) {
      return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
    }

    const entry = await db.waitlistEntry.create({
      data: {
        businessId: business.id,
        serviceId,
        staffId: staffId || null,
        name,
        phone: normalisePhone(phone),
        email: email || null,
        preferredDate: new Date(preferredDate),
        expiresAt: addDays(new Date(), 30),
      },
    });

    return NextResponse.json({ id: entry.id, success: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "businesses:slug:waitlist");
  }
}
