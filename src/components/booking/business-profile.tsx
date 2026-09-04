import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { normalisePhone } from "@/lib/phone";
import { nowInArgentina } from "@/lib/timezone";
import { cn } from "@/lib/utils";

import { GalleryCollage, type Photo } from "./profile/gallery-collage";
import { OpeningHours, openUntil, type DayHours } from "./profile/opening-hours";
import { ServiceList } from "./profile/service-list";
import { ShareButton } from "./profile/share-button";

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  response?: string | null;
  createdAt: string;
  clientName: string;
}

interface BusinessProfileProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    website: string | null;
    about: string | null;
    instagram: string | null;
    facebook: string | null;
    tiktok: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    primaryColor: string | null;
    accentColor: string | null;
    /** Shown to the visitor before they book, not hidden in the wizard. */
    cancellationPolicy: string | null;
    /** 0.3 for a 30% deposit; null when the shop does not take one. */
    depositRate: number | null;
  };
  gallery: Photo[];
  categories: Array<{
    id: string;
    name: string;
    services: Array<{
      id: string;
      name: string;
      description: string | null;
      duration: number;
      price: number;
      image: string | null;
    }>;
  }>;
  staff: Array<{
    id: string;
    name: string;
    image: string | null;
    bio: string | null;
    specialty: string | null;
    workingHours: DayHours[];
  }>;
  reviews?: ReviewData[];
  averageRating?: number;
  reviewCount?: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function relativeDate(iso: string, now: Date) {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `hace ${Math.max(minutes, 1)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

/**
 * The shop's page.
 *
 * It used to be one 828-line client component whose every section started at
 * `opacity-0` and was faded in by a GSAP timeline — so with JavaScript blocked,
 * or before it ran, the page was blank. It is a server component now; only the
 * gallery, the category filter and the share sheet need the browser, and each
 * of those is its own island.
 *
 * The order follows the design: the photos, then who this is and the one button
 * that matters, then the services — everything a visitor came for above the
 * fold — with hours, the map and the cancellation policy in a column beside it.
 */
export function BusinessProfile({
  business,
  gallery,
  categories,
  staff,
  reviews = [],
  averageRating = 0,
  reviewCount = 0,
}: BusinessProfileProps) {
  const now = nowInArgentina();

  // No table of business hours exists: the shop is open when somebody is
  // working, so these are the union of every professional's hours.
  const hours: DayHours[] = [];
  for (let day = 0; day < 7; day++) {
    const forDay = staff.flatMap((member) =>
      member.workingHours.filter((entry) => entry.dayOfWeek === day)
    );
    if (forDay.length === 0) continue;
    hours.push({
      dayOfWeek: day,
      startTime: forDay.reduce((min, e) => (e.startTime < min ? e.startTime : min), "23:59"),
      endTime: forDay.reduce((max, e) => (e.endTime > max ? e.endTime : max), "00:00"),
    });
  }

  const closesAt = openUntil(hours, now);
  const whatsapp = business.whatsapp ? normalisePhone(business.whatsapp) : null;
  const location = [business.address, business.city, business.province].filter(Boolean).join(", ");
  const cover: Photo[] = business.coverUrl
    ? [{ id: "cover", url: business.coverUrl, caption: null }, ...gallery]
    : gallery;

  return (
    <div>
      <GalleryCollage photos={cover} alt={business.name} />

      <div className="px-[18px] lg:px-14">
        <div className="relative z-[2] my-5 flex flex-col gap-4 rounded-[18px] border border-border bg-card p-5 shadow-[0_16px_40px_-22px_rgba(9,9,11,0.25)] lg:my-7 lg:flex-row lg:items-center lg:gap-[22px] lg:p-[26px_28px]">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt=""
              width={76}
              height={76}
              className="size-[60px] shrink-0 rounded-[18px] object-cover lg:size-[76px]"
            />
          ) : (
            <span
              className="flex size-[60px] shrink-0 items-center justify-center rounded-[18px] bg-primary text-[22px] font-extrabold text-primary-foreground lg:size-[76px] lg:text-[26px]"
              aria-hidden
            >
              {initials(business.name)}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
              <h1 className="text-[22px] font-extrabold tracking-[-0.035em] lg:text-[26px]">
                {business.name}
              </h1>
              {closesAt && <Badge variant="jade">ABIERTO HASTA LAS {closesAt}</Badge>}
            </div>

            <p className="mb-2 text-[12.5px] text-muted-foreground">
              {reviewCount > 0 && (
                <>
                  <span className="font-bold text-star">★ {averageRating.toFixed(1)}</span> ·{" "}
                  {reviewCount} {reviewCount === 1 ? "reseña" : "reseñas"} ·{" "}
                </>
              )}
              {location || business.city}
            </p>

            {business.description && (
              <p className="max-w-[560px] text-[12.5px] leading-[1.6] text-muted-foreground">
                {business.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-2">
            <Link
              href={`/${business.slug}/reservar`}
              className="rounded-[11px] bg-primary px-[30px] py-3.5 text-center text-[13.5px] font-bold text-primary-foreground shadow-cta transition-colors hover:bg-[#22c55e]"
            >
              Reservar turno
            </Link>
            <div className="flex gap-2">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener"
                  className={secondary}
                >
                  <MessageCircle className="size-3.5" aria-hidden />
                  WhatsApp
                </a>
              )}
              <ShareButton name={business.name} className={secondary} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 pb-12 lg:grid-cols-[1fr_340px]">
          {/* min-w-0: a grid item's minimum is its content, so one row that
              refuses to shrink drags the whole column past the viewport. */}
          <div className="min-w-0">
            <ServiceList
              categories={categories}
              slug={business.slug}
              depositRate={business.depositRate}
            />

            {staff.length > 0 && (
              <section className="mb-7">
                <h2 className="mb-3 text-[17px] font-extrabold tracking-[-0.02em]">
                  Nuestro equipo
                </h2>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {staff.map((member, index) => (
                    <article
                      key={member.id}
                      className="flex gap-3 rounded-[13px] border border-border bg-card p-3.5"
                    >
                      {member.image ? (
                        <Image
                          src={member.image}
                          alt=""
                          width={54}
                          height={54}
                          className="size-[54px] shrink-0 rounded-[14px] object-cover"
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex size-[54px] shrink-0 items-center justify-center rounded-[14px] text-base font-extrabold",
                            // The design alternates jade and violet so a row of
                            // professionals does not read as one block of green.
                            index % 2 === 0
                              ? "bg-primary text-primary-foreground"
                              : "bg-staff-2-fill text-staff-2-strong"
                          )}
                          aria-hidden
                        >
                          {initials(member.name)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-bold">{member.name}</h3>
                        {member.specialty && (
                          <span
                            className={cn(
                              "my-1 inline-block rounded-full px-2.5 py-0.5 text-[9.5px] font-semibold",
                              index % 2 === 0
                                ? "bg-jade-fill text-jade-label"
                                : "bg-staff-2-fill text-staff-2-strong"
                            )}
                          >
                            {member.specialty}
                          </span>
                        )}
                        {member.bio && (
                          <p className="text-[10.5px] leading-[1.5] text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {reviews.length > 0 && (
              <section>
                <div className="mb-3 flex flex-wrap items-baseline gap-2.5">
                  <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">Reseñas</h2>
                  <span className="text-xs font-bold text-star">★ {averageRating.toFixed(1)}</span>
                  <span className="text-[11px] text-faint">
                    {reviewCount} {reviewCount === 1 ? "reseña verificada" : "reseñas verificadas"}
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <article
                      key={review.id}
                      className="rounded-[13px] border border-border bg-card p-4"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="flex size-[26px] items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground"
                            aria-hidden
                          >
                            {initials(review.clientName)}
                          </span>
                          <div>
                            <p className="text-[11.5px] font-semibold">{review.clientName}</p>
                            <p className="text-[9px] text-faint">
                              {relativeDate(review.createdAt, now)}
                            </p>
                          </div>
                        </div>
                        <span
                          className="shrink-0 text-[10px] tracking-[1.5px] text-star"
                          aria-label={`${review.rating} de 5`}
                        >
                          {"★".repeat(review.rating)}
                          <span className="opacity-25">{"★".repeat(5 - review.rating)}</span>
                        </span>
                      </div>

                      {review.comment && (
                        <p className="text-[11.5px] leading-[1.6] text-muted-foreground">
                          {review.comment}
                        </p>
                      )}

                      {review.response && (
                        <div className="mt-2 border-l-2 border-primary pl-2.5">
                          <p className="mb-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-jade-label">
                            Respuesta del negocio
                          </p>
                          <p className="text-[10.5px] text-muted-foreground">{review.response}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-3">
            {hours.length > 0 && <OpeningHours hours={hours} today={now.getDay()} />}

            {location && (
              <section className="overflow-hidden rounded-[14px] border border-border bg-card">
                <iframe
                  title={`Mapa de ${business.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`}
                  loading="lazy"
                  className="h-[130px] w-full border-0"
                />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="min-w-0 text-[11.5px] font-semibold">{location}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                    target="_blank"
                    rel="noopener"
                    className="shrink-0 text-[10.5px] font-semibold text-jade-link"
                  >
                    Cómo llegar →
                  </a>
                </div>
              </section>
            )}

            {business.cancellationPolicy && (
              <section className="rounded-[14px] border border-border bg-card p-4">
                <h2 className="mb-1.5 text-xs font-bold">Cancelaciones</h2>
                <p className="text-[11px] leading-[1.6] text-muted-foreground">
                  {business.cancellationPolicy}
                </p>
              </section>
            )}

            {business.about && (
              <section className="rounded-[14px] border border-border bg-card p-4">
                <h2 className="mb-1.5 text-xs font-bold">Sobre nosotros</h2>
                <p className="whitespace-pre-line text-[11px] leading-[1.6] text-muted-foreground">
                  {business.about}
                </p>
              </section>
            )}

            <p className="pt-1 text-center text-[10px] text-faint">
              Agenda online por <span className="font-semibold text-jade-link">jiku</span>{" "}
              <span className="font-serif text-jade-link">軸</span>
            </p>
          </aside>
        </div>
      </div>

      {/* On a phone the one action worth having always in reach. */}
      <div className="safe-bottom safe-x fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-[18px] py-3 backdrop-blur-xl lg:hidden">
        <Link
          href={`/${business.slug}/reservar`}
          className="flex items-center justify-center rounded-[11px] bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-cta"
        >
          Reservar turno{closesAt && ` · hoy hasta las ${closesAt}`}
        </Link>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </div>
  );
}

const secondary =
  "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-background px-4 py-2.5 text-[11.5px] text-muted-foreground transition-colors hover:border-faint";
