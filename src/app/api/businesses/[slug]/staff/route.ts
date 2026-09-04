import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { safeImageUrl } from "@/lib/images";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await resolveBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get("serviceId");

    const where: Record<string, unknown> = {
      businessId: business.id,
      isActive: true,
    };

    if (serviceId) {
      where.OR = [
        { services: { some: { serviceId } } },
        { services: { none: {} } },
      ];
    }

    const staff = await db.staffMember.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        workingHours: {
          where: { isActive: true },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    const result = staff.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      image: safeImageUrl(s.image),
      bio: s.bio,
      specialty: s.specialty,
      workingHours: s.workingHours.map((wh) => ({
        dayOfWeek: wh.dayOfWeek,
        startTime: wh.startTime,
        endTime: wh.endTime,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "businesses:slug:staff");
  }
}
