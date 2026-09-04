import Link from "next/link";
import Image from "next/image";

import { formatCurrency } from "@/lib/format";
import type { DirectoryBusiness } from "@/lib/directory";

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * A shop in the directory: its photo, its rating, and what it costs to walk in.
 *
 * The card used to lead with a logo on a coloured square and three service
 * chips, which made a page of results look like a page of avatars. The cover
 * photo and "desde $X" are what someone actually chooses between.
 */
export function BusinessCard({ business }: { business: DirectoryBusiness }) {
  return (
    <Link
      href={`/${business.slug}`}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_28px_-14px_rgba(9,9,11,0.18)] transition-[transform,border-color] duration-[250ms] hover:-translate-y-1 hover:border-primary"
    >
      <div className="relative h-[130px]">
        {business.coverImage ? (
          <Image
            src={business.coverImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : business.logo ? (
          <Image
            src={business.logo}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="brand-gradient flex h-full items-center justify-center text-2xl font-extrabold text-primary-foreground">
            {initials(business.name)}
          </div>
        )}
        <span className="absolute right-2.5 top-2.5 rounded-full bg-card/95 px-2.5 py-1 text-[8.5px] font-bold text-jade-label">
          RESERVA ONLINE
        </span>
      </div>

      <div className="p-4 pt-4 sm:px-[18px] sm:pb-[18px]">
        <h3 className="truncate text-[14.5px] font-bold">{business.name}</h3>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
          {business.averageRating !== null ? (
            <>
              <span className="text-star">★ {business.averageRating}</span> ({business.reviewCount})
              ·{" "}
            </>
          ) : (
            <>Sin reseñas todavía · </>
          )}
          {business.city}
        </p>
        {business.fromPrice !== null && (
          <p className="mt-[7px] text-[11px] font-semibold text-jade-label">
            Reservás online · desde {formatCurrency(business.fromPrice)}
          </p>
        )}
      </div>
    </Link>
  );
}
