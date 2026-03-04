"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  name: string;
  description: string | null;
  duration: number;
  price: number;
  selected?: boolean;
  onClick?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

function formatPrice(price: number): string {
  return price.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 });
}

export function ServiceCard({ name, description, duration, price, selected, onClick }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "glass rounded-xl p-5 text-left w-full transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/5",
        selected && "ring-2 ring-primary scale-[1.02] shadow-lg shadow-primary/10 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-semibold text-base mb-1">{name}</h4>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {description}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            {formatDuration(duration)}
          </span>
        </div>
        <span className="text-lg font-heading font-bold brand-text shrink-0">
          {formatPrice(price)}
        </span>
      </div>
    </button>
  );
}
