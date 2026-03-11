"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Search, MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BusinessCard } from "@/components/directory/business-card";

interface BusinessResult {
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

interface ExplorePageClientProps {
  initialQuery?: string;
}

export function ExplorePageClient({ initialQuery = "" }: ExplorePageClientProps) {
  const [query, setQuery] = useState(initialQuery);
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [page, setPage] = useState(1);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  const debounceTimer = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (value: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          setDebouncedQuery(value);
          setPage(1);
        }, 300);
      };
    })(),
    []
  );

  const handleSearch = (value: string) => {
    setQuery(value);
    debounceTimer(value);
  };

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (debouncedQuery) params.set("q", debouncedQuery);
  if (city) params.set("city", city);
  if (province) params.set("province", province);

  const { data, isLoading } = useSWR(`/api/directory?${params}`);
  const businesses: BusinessResult[] = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen">
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
    </div>
  );
}
