"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
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
    <main id="contenido" className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-3xl sm:text-5xl font-heading font-bold mb-4">
            Explorá negocios
          </h1>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Encontrá el lugar perfecto para tu próximo turno
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto glass rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Ciudad"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Real links to the per-city pages. Typing a city into the box above
              filters this list without changing the URL, which means nothing a
              crawler can follow and nothing anyone can share. */}
          {cities.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {cities.slice(0, 10).map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/explorar/${entry.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {entry.city}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-muted-foreground">No se encontraron negocios</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
