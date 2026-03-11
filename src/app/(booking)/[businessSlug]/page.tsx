import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BusinessProfile } from "@/components/booking/business-profile";

interface Props {
  params: Promise<{ businessSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { businessSlug } = await params;

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
    select: { name: true, description: true, coverImage: true, logo: true },
  });

  if (!business) return { title: "Negocio no encontrado" };

  const ogImage = business.coverImage || business.logo || undefined;

  return {
    title: `${business.name} - Reserva tu turno`,
    description: business.description || `Reserva turnos online en ${business.name}. Rapido, simple y seguro con Jiku.`,
    openGraph: {
      title: `${business.name} - Reserva tu turno`,
      description: business.description || `Reserva turnos online en ${business.name}`,
      ...(ogImage && { images: [{ url: ogImage }] }),
    },
    twitter: {
      card: business.coverImage ? "summary_large_image" : "summary",
    },
  };
}

export default async function BusinessProfilePage({ params }: Props) {
  const { businessSlug } = await params;

  const business = await db.business.findUnique({
    where: { slug: businessSlug },
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
          workingHours: {
            where: { isActive: true },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      },
    },
  });

  if (!business || !business.isActive) notFound();

  const categories = business.categories
    .filter((c) => c.services.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      services: c.services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        image: s.image,
      })),
    }));

  const uncategorizedServices = await db.service.findMany({
    where: {
      businessId: business.id,
      isActive: true,
      categoryId: null,
    },
    orderBy: { name: "asc" },
  });

  if (uncategorizedServices.length > 0) {
    categories.push({
      id: "general",
      name: "General",
      services: uncategorizedServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        duration: s.duration,
        price: Number(s.price),
        image: s.image,
      })),
    });
  }

  const staffData = business.staff.map((s) => ({
    id: s.id,
    name: s.name,
    image: s.image,
    bio: s.bio,
    specialty: s.specialty,
    workingHours: s.workingHours.map((wh) => ({
      dayOfWeek: wh.dayOfWeek,
      startTime: wh.startTime,
      endTime: wh.endTime,
    })),
  }));

  // Fetch reviews for public display
  const [reviewsRaw, reviewAgg] = await Promise.all([
    db.review.findMany({
      where: { businessId: business.id, isVisible: true },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        guestClient: { select: { name: true } },
      },
    }),
    db.review.aggregate({
      where: { businessId: business.id, isVisible: true },
      _avg: { rating: true },
      _count: true,
    }),
  ]);

  const reviews = reviewsRaw.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    clientName: r.user?.name || r.guestClient?.name || "Cliente",
  }));

  return (
    <BusinessProfile
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
        phone: business.phone,
        whatsapp: business.whatsapp,
        email: business.email,
        address: business.address,
        city: business.city,
        province: business.province,
        logoUrl: business.logo,
        coverUrl: business.coverImage,
        primaryColor: business.primaryColor,
        accentColor: business.accentColor,
      }}
      categories={categories}
      staff={staffData}
      reviews={reviews}
      averageRating={reviewAgg._avg.rating ?? 0}
      reviewCount={reviewAgg._count}
    />
  );
}
