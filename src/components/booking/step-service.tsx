"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import gsap from "gsap";
import { useBookingStore } from "@/stores/booking-store";
import { ServiceCard } from "./service-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ServiceCategory {
  id: string;
  name: string;
  services: Array<{
    id: string;
    name: string;
    description: string | null;
    duration: number;
    price: number;
    staffIds: string[];
  }>;
}

export function StepService({ slug }: { slug: string }) {
  const { serviceId, setService, setStep } = useBookingStore();
  const { data: categories, isLoading } = useSWR<ServiceCategory[]>(`/api/businesses/${slug}/services`);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categories && categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  useEffect(() => {
    if (!gridRef.current || isLoading) return;
    gsap.fromTo(
      gridRef.current.querySelectorAll(".service-card-item"),
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power3.out" }
    );
  }, [activeCategory, isLoading]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Este negocio no tiene servicios configurados.</p>;
  }

  const showTabs = categories.length > 1;
  const currentCategory = categories.find((c) => c.id === activeCategory) || categories[0];

  const handleSelect = (service: ServiceCategory["services"][0]) => {
    setService(service.id, service.name, service.duration, service.price);
    setStep(1);
  };

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Elegir servicio</h2>
      <p className="text-sm text-muted-foreground mb-6">Selecciona el servicio que necesitas</p>

      {/* Category tabs */}
      {showTabs && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200",
                cat.id === activeCategory
                  ? "brand-gradient text-white shadow-md shadow-primary/20"
                  : "glass text-muted-foreground hover:text-foreground"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Service grid */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {currentCategory.services.map((service) => (
          <div key={service.id} className="service-card-item">
            <ServiceCard
              name={service.name}
              description={service.description}
              duration={service.duration}
              price={service.price}
              selected={serviceId === service.id}
              onClick={() => handleSelect(service)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
