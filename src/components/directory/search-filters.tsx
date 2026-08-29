"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search } from "lucide-react";

interface Filters {
  q?: string;
  city?: string;
  province?: string;
  category?: string;
}

interface SearchFiltersProps {
  onFilter: (filters: Filters) => void;
}

export function SearchFilters({ onFilter }: SearchFiltersProps) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitFilter = useCallback(
    (filters: Filters) => {
      const clean: Filters = {};
      if (filters.q?.trim()) clean.q = filters.q.trim();
      if (filters.city?.trim()) clean.city = filters.city.trim();
      if (filters.province?.trim()) clean.province = filters.province.trim();
      if (filters.category?.trim()) clean.category = filters.category.trim();
      onFilter(clean);
    },
    [onFilter]
  );

  // Debounced text search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      emitFilter({ q, city, province, category });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, city, province, category, emitFilter]);

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      {/* Text search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o servicio..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Dropdown filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ciudad"
          className="px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="text"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="Provincia"
          className="px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Categoría"
          className="px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
    </div>
  );
}
