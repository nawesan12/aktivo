import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const city = searchParams.get("city");
    const province = searchParams.get("province");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.BusinessWhereInput = {
      isActive: true,
    };

    if (q) {
      where.name = { contains: q, mode: "insensitive" };
    }

    if (city) {
      where.city = city;
    }

    if (province) {
      where.province = province;
    }

    if (category) {
      where.services = {
        some: {
          category: {
            name: { contains: category, mode: "insensitive" },
          },
        },
      };
    }

    const [businesses, total] = await Promise.all([
      db.business.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          city: true,
          province: true,
          services: {
            where: { isActive: true },
            take: 3,
            orderBy: { name: "asc" },
            select: { name: true },
          },
          reviews: {
            where: { isVisible: true },
            select: { rating: true },
          },
        },
      }),
      db.business.count({ where }),
    ]);

    const data = businesses.map((biz) => {
      const reviewCount = biz.reviews.length;
      const averageRating =
        reviewCount > 0
          ? Math.round(
              (biz.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount) *
                10
            ) / 10
          : null;

      return {
        id: biz.id,
        name: biz.name,
        slug: biz.slug,
        description: biz.description,
        logo: biz.logo,
        city: biz.city,
        province: biz.province,
        averageRating,
        reviewCount,
        topServices: biz.services.map((s) => s.name),
      };
    });

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Directory error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
