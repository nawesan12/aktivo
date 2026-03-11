import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  city: string | null;
  province: string | null;
  averageRating: number;
  reviewCount: number;
  topServices: string[];
}

interface BusinessCardProps {
  business: Business;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= Math.round(rating)
              ? "text-yellow-500 fill-yellow-500"
              : "text-zinc-600"
          }`}
        />
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function BusinessCard({ business }: BusinessCardProps) {
  const location = [business.city, business.province].filter(Boolean).join(", ");

  return (
    <Link href={`/${business.slug}`} className="block group">
      <div className="glass rounded-xl p-5 transition-all duration-200 hover:shadow-lg hover:scale-[1.02]">
        <div className="flex items-start gap-4">
          {/* Logo / Avatar */}
          {business.logo ? (
            <Image
              src={business.logo}
              alt={business.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl object-cover shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {getInitials(business.name)}
              </span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* Name */}
            <h3 className="font-heading font-bold text-base truncate group-hover:text-primary transition-colors">
              {business.name}
            </h3>

            {/* Location */}
            {location && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {location}
              </p>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={business.averageRating} />
              <span className="text-xs text-muted-foreground">
                {business.averageRating.toFixed(1)} ({business.reviewCount}{" "}
                {business.reviewCount === 1 ? "resena" : "resenas"})
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
            {business.description}
          </p>
        )}

        {/* Top services */}
        {business.topServices.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap">
            {business.topServices.slice(0, 3).map((service) => (
              <span
                key={service}
                className="px-2 py-0.5 text-[11px] rounded-full bg-primary/10 text-primary font-medium"
              >
                {service}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
