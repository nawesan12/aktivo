import Image from "next/image";
import Link from "next/link";
import { MapPin, MessageCircle, Star } from "lucide-react";

import { safeImageUrl } from "@/lib/images";
import { normalisePhone } from "@/lib/phone";
import { cn } from "@/lib/utils";

export interface CoverBusiness {
  slug: string;
  name: string;
  logo: string | null;
  coverImage: string | null;
  city: string | null;
  address: string | null;
  province: string | null;
  whatsapp: string | null;
  rating: number | null;
  reviewCount: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * The shop's cover and identity, above the booking screen.
 *
 * The route used to open straight onto step one of a wizard under a 56px bar
 * with a 28px logo in it — a customer arriving from a service link on Instagram
 * saw a form before they saw whose shop it was. The photo and the name come
 * first now, exactly as they do on the profile page.
 */
export function BusinessCover({
  business,
  openUntil,
  className,
}: {
  business: CoverBusiness;
  /** "20:00" when the shop is still open today, null when it is closed. */
  openUntil?: string | null;
  className?: string;
}) {
  const cover = safeImageUrl(business.coverImage);
  const logo = safeImageUrl(business.logo);
  const whatsapp = business.whatsapp ? normalisePhone(business.whatsapp) : null;
  const mapsQuery = [business.address, business.city, business.province].filter(Boolean).join(", ");

  return (
    <div className={className}>
      <div className="relative h-[110px] overflow-hidden lg:h-[180px]">
        {cover ? (
          <Image src={cover} alt="" fill sizes="100vw" priority className="object-cover" />
        ) : (
          <div className="brand-gradient absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(9,9,11,0.55)] to-transparent" />
      </div>

      <div className="px-[18px] lg:px-12">
        {/*
          On a phone the identity is a white card overlapping the photo; on a
          desktop it is the logo and the name sitting straight on the page. Same
          content, and the design draws them differently because the phone has no
          room for the row of actions on the right.
        */}
        <div className="relative -mt-[26px] mb-4 flex items-center gap-3 rounded-[14px] border border-border bg-card p-3.5 shadow-[0_12px_30px_-16px_rgba(9,9,11,0.3)] lg:-mt-[34px] lg:mb-[22px] lg:items-end lg:gap-[18px] lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={76}
              height={76}
              className="size-[46px] shrink-0 rounded-xl object-cover lg:size-[76px] lg:rounded-[18px] lg:border-4 lg:border-background"
            />
          ) : (
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-xl bg-primary text-[15px] font-extrabold text-primary-foreground lg:size-[76px] lg:rounded-[18px] lg:border-4 lg:border-background lg:text-2xl">
              {initials(business.name)}
            </span>
          )}

          <div className="min-w-0 flex-1 lg:pb-1.5">
            <h1 className="truncate text-base font-extrabold leading-tight tracking-[-0.02em] lg:text-2xl lg:tracking-[-0.03em]">
              {business.name}
            </h1>
            <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground lg:mt-[2px] lg:text-xs">
              {business.rating !== null && (
                <>
                  <span className="text-star">★ {business.rating}</span> ({business.reviewCount}) ·{" "}
                </>
              )}
              {business.city}
              {openUntil && (
                <>
                  {" · "}
                  <span className="font-semibold text-jade-label">
                    Abierto hasta las {openUntil}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="hidden gap-2 pb-2 lg:flex">
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noopener"
                className={action}
              >
                <MessageCircle className="size-3.5" aria-hidden />
                WhatsApp
              </a>
            )}
            {mapsQuery && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                target="_blank"
                rel="noopener"
                className={action}
              >
                <MapPin className="size-3.5" aria-hidden />
                Cómo llegar
              </a>
            )}
            <Link href={`/${business.slug}`} className={action}>
              <Star className="size-3.5" aria-hidden />
              Ver el local
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const action = cn(
  "flex items-center gap-1.5 rounded-[10px] border border-border bg-card px-4 py-[9px] text-xs text-muted-foreground transition-colors hover:border-faint"
);
