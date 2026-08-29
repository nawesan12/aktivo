import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const business = await db.business.findUnique({
      where: { slug },
      include: {
        settings: true,
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            services: {
              where: { isActive: true },
              orderBy: { name: "asc" },
            },
          },
        },
        staff: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            workingHours: true,
          },
        },
      },
    });

    if (!business || !business.isActive) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    return handleApiError(error, "businesses:slug");
  }
}
