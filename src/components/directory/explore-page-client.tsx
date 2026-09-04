"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { BusinessCard } from "@/components/directory/business-card";
import type { DirectoryBusiness, DirectoryCity, DirectoryPage } from "@/lib/directory";
import { useDebounced } from "@/hooks/use-debounced";

interface ExplorePageClientProps {
  /** SWR key the server-rendered results correspond to. */
  initialKey?: string;
  initialResults?: DirectoryPage;
  /** Cities with something to show, for the per-city pages. */
  cities?: DirectoryCity[];
}

export function ExplorePageClient({
  initialKey,
  initialResults,
  cities = [],
}: ExplorePageClientProps) {
  // Read here rather than on the server. Reading it there made the page
  // dynamic, and this filter was always a client-side concern: someone typing
  // in the box, or arriving with a shared link.
  const initialQuery = useSearchParams().get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("");
  // No province selector in the interface yet; the API accepts one.
  const [province] = useState("");
  const [page, setPage] = useState(1);

  // The same debounce every other search box in the app uses, instead of a
  // hand-rolled timer ref kept alive by a useCallback.
  const debouncedQuery = useDebounced(query);

  const handleSearch = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (debouncedQuery) params.set("q", debouncedQuery);
  if (city) params.set("city", city);
  if (province) params.set("province", province);

  const swrKey = `/api/directory?${params}`;

  // The first render reuses what the server already fetched, so the list is
  // painted (and indexable) without a client round-trip. Any other filter
  // combination goes through SWR as usual.
  const { data, isLoading } = useSWR(
    swrKey,
    swrKey === initialKey && initialResults
      ? { fallbackData: initialResults }
      : undefined
  );

  const businesses: DirectoryBusiness[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <main
      id="contenido"
      className="min-h-screen bg-[radial-gradient(800px_380px_at_50%_-5%,rgba(74,222,128,0.12),transparent_60%)] pb-11"
    >
      <div className="bg-dots absolute inset-0 -z-10" aria-hidden />

      <div className="px-6 pb-7 pt-12 text-center sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-[28px] font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-4xl">
            Reservá en los mejores
            <br />
            <span className="font-serif text-[1.1em] font-semibold italic text-jade-link">
              de tu barrio.
            </span>
          </h1>

          {/* Two pills and a button, not a card with three inputs in it. */}
          <div className="mx-auto mt-[26px] flex max-w-[560px] flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-[18px] top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                placeholder="Barbería, uñas, spa..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Buscar un negocio"
                className="h-auto rounded-full border-border bg-card py-[13px] pl-11 pr-5 text-[13px] shadow-[0_6px_20px_-10px_rgba(9,9,11,0.15)]"
              />
            </div>
            <div className="relative sm:w-[190px]">
              <MapPin className="absolute left-[18px] top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tu ciudad"
                value={city}
                onChange={(e) => { setCity(e.target.value); setPage(1); }}
                aria-label="Filtrar por ciudad"
                className="h-auto rounded-full border-border bg-card py-[13px] pl-11 pr-5 text-[13px]"
              />
            </div>
          </div>

          {/* Real links to the per-city pages. Typing a city into the box above
              filters this list without changing the URL, which means nothing a
              crawler can follow and nothing anyone can share. */}
          {cities.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-[7px] text-[11px]">
              {cities.slice(0, 10).map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/explorar/${entry.slug}`}
                  className="rounded-full border border-border bg-card px-3.5 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-jade-label"
                >
                  {entry.city}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        {isLoading ? (
          // Skeletons in the shape of the cards, not a spinner in an empty page:
          // the layout stops jumping when the results land.
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-card"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <Skeleton className="h-[130px] rounded-none" />
                <div className="space-y-2 p-[18px]">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-14 text-center">
            <MapPin className="mx-auto mb-3 size-10 text-disabled" aria-hidden />
            <p className="mb-1 text-[15px] font-bold">No encontramos nada con eso</p>
            <p className="mx-auto max-w-[320px] text-xs text-muted-foreground">
              Probá con otro nombre, o mirá todos los negocios de tu ciudad en los chips de arriba.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((biz) => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted"
                >
                  Anterior
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-50 hover:bg-muted"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
