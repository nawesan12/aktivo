"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BusinessCard } from "@/components/directory/business-card";
import type { DirectoryBusiness, DirectoryPage } from "@/lib/directory";

interface ExplorePageClientProps {
  /** SWR key the server-rendered results correspond to. */
  initialKey?: string;
  initialResults?: DirectoryPage;
}

export function ExplorePageClient({
  initialKey,
  initialResults,
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
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // The timer lives in a ref rather than in an IIFE closure: the previous
  // version re-ran the factory on every render and only survived because
  // useCallback happened to keep the first result.
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const debounceTimer = useCallback((value: string) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      setPage(1);
    }, 300);
  }, []);

  // Don't leave a pending search running after the page is gone.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSearch = (value: string) => {
    setQuery(value);
    debounceTimer(value);
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
