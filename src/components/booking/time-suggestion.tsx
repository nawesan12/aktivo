"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

interface SuggestionData {
  suggestedDay: number | null;
  suggestedTime: string | null;
  confidence: "high" | "medium" | "low";
}

interface TimeSuggestionProps {
  slug: string;
  serviceId: string;
  staffId: string;
  onSelect: (day: number, time: string) => void;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  high: "bg-success-muted text-success-foreground",
  medium: "bg-warning-muted text-warning-foreground",
  low: "bg-neutral/20 text-neutral-foreground",
};

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function TimeSuggestion({ slug, serviceId, staffId, onSelect }: TimeSuggestionProps) {
  const { data: session } = useSession();

  const { data } = useSWR<SuggestionData>(
    session
      ? `/api/businesses/${slug}/suggestions?serviceId=${serviceId}&staffId=${staffId}`
      : null
  );

  if (!session || !data || data.suggestedDay === null || !data.suggestedTime) {
    return null;
  }

  const dayName = DAY_NAMES[data.suggestedDay];

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Tu horario habitual</p>
          <p className="text-sm text-muted-foreground">
            {dayName} {data.suggestedTime}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            CONFIDENCE_STYLES[data.confidence] || CONFIDENCE_STYLES.low
          }`}
        >
          {CONFIDENCE_LABELS[data.confidence] || "Baja"}
        </span>
        <button
          onClick={() => onSelect(data.suggestedDay!, data.suggestedTime!)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg brand-gradient text-white shrink-0"
        >
          Seleccionar
        </button>
      </div>
    </div>
  );
}
