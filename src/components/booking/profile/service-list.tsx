"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

/**
 * One row per service: photo, what it is, what it costs, and the button.
 *
 * The previous grid of cards made the whole card the link, so there was no way
 * to read the list without every row inviting a click. The deposit is spelled
 * out under the price, because "seña $3.600" is the number that decides whether
 * someone books now or later.
 */
export function ServiceList({
  categories,
  slug,
  depositRate,
}: {
  categories: Category[];
  slug: string;
  /** 0.3 for a 30% deposit; null when the shop does not take one. */
  depositRate: number | null;
}) {
  const [active, setActive] = useState<string | null>(null);
  const shown = active ? categories.filter((category) => category.id === active) : categories;

  return (
    <section className="mb-7">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-extrabold tracking-[-0.02em]">Servicios</h2>
        {categories.length > 1 && (
          <div className="flex min-w-0 flex-wrap gap-1.5 text-[11px]">
            <Chip active={active === null} onClick={() => setActive(null)}>
              Todos
            </Chip>
            {categories.map((category) => (
              <Chip
                key={category.id}
                active={active === category.id}
                onClick={() => setActive(category.id)}
              >
                {category.name}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {shown.flatMap((category) =>
          category.services.map((service) => (
            <article
              key={service.id}
              className="flex items-center gap-3 rounded-[13px] border border-border bg-card p-3.5 transition-colors hover:border-primary sm:gap-3.5"
            >
              {service.image ? (
                <Image
                  src={service.image}
                  alt=""
                  width={52}
                  height={52}
                  className="size-[52px] shrink-0 rounded-[10px] object-cover"
                />
              ) : (
                <span
                  className="flex size-[52px] shrink-0 items-center justify-center rounded-[10px] bg-muted text-[15px] font-bold text-faint"
                  aria-hidden
                >
                  {service.name.charAt(0)}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13.5px] font-bold">{service.name}</h3>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {service.duration} min
                  {service.description ? ` · ${service.description}` : ""}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[14.5px] font-extrabold text-jade-label">
                  {formatCurrency(service.price)}
                </p>
                {depositRate !== null && (
                  <p className="text-[10px] text-faint">
                    seña {formatCurrency(Math.round(service.price * depositRate))}
                  </p>
                )}
              </div>

              <Link
                href={`/${slug}/reservar?serviceId=${service.id}`}
                className="hidden shrink-0 rounded-[9px] border border-border bg-card px-[18px] py-2.5 text-[11.5px] font-semibold transition-colors hover:border-primary hover:text-jade-label sm:block"
              >
                Reservar
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full px-3 py-[5px] transition-colors",
        active
          ? "border border-jade-link/30 bg-jade-fill font-semibold text-jade-label"
          : "border border-border bg-card text-muted-foreground hover:border-faint"
      )}
    >
      {children}
    </button>
  );
}
