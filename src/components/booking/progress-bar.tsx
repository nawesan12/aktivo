"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Servicio" },
  { label: "Profesional" },
  { label: "Fecha y Hora" },
  { label: "Tus Datos" },
  { label: "Confirmacion" },
];

interface ProgressBarProps {
  currentStep: number;
}

export function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between relative">
        {/* Connecting line (background) */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-border mx-8" />
        {/* Connecting line (filled) */}
        <div
          className="absolute top-4 left-0 h-0.5 brand-gradient mx-8 transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / (STEPS.length - 1)) * (100 - 10)}%` }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          return (
            <div key={step.label} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                  isCompleted && "brand-gradient text-white shadow-lg shadow-primary/20",
                  isActive && "brand-gradient text-white ring-4 ring-primary/20 shadow-lg shadow-primary/30",
                  !isCompleted && !isActive && "bg-secondary text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] sm:text-xs mt-2 font-medium transition-colors duration-300 text-center",
                  isActive && "text-primary",
                  isCompleted && "text-foreground",
                  !isCompleted && !isActive && "text-muted-foreground"
                )}
              >
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.label.split(" ")[0]}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
