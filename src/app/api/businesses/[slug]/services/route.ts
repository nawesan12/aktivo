import { NextResponse } from "next/server";
import { resolveBusinessBySlug } from "@/lib/business-resolver";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";
import { safeImageUrl } from "@/lib/images";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const business = await resolveBusinessBySlug(slug);

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    const categories = await db.serviceCategory.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: "asc" },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            staff: {
              select: { staffId: true },
            },
          },
        },
      },
    });

    // Also get uncategorized services
    const uncategorized = await db.service.findMany({
      where: {
        businessId: business.id,
        isActive: true,
        categoryId: null,
      },
      orderBy: { name: "asc" },
      include: {
        staff: {
          select: { staffId: true },
        },
      },
    });

    const result = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      services: cat.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        image: safeImageUrl(s.image),
        staffIds: s.staff.map((ss) => ss.staffId),
      })),
    }));

    if (uncategorized.length > 0) {
      result.push({
        id: "uncategorized",
        name: "General",
        services: uncategorized.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          duration: s.duration,
          price: Number(s.price),
          image: safeImageUrl(s.image),
          staffIds: s.staff.map((ss) => ss.staffId),
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, "businesses:slug:services");
  }
}
