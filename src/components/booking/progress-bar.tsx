"use client";

import { Check, Scissors, UserCheck, CalendarDays, ClipboardList, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Servicio", icon: Scissors },
  { label: "Profesional", icon: UserCheck },
  { label: "Fecha y hora", icon: CalendarDays },
  { label: "Tus datos", icon: ClipboardList },
  { label: "Listo", icon: CheckCircle2 },
];

interface ProgressBarProps {
  currentStep: number;
}

/**
 * The five steps, laid out on a grid.
 *
 * It used to be `justify-between` with the connecting line absolutely
 * positioned at `top-4` and inset by a fixed `mx-8`, and its filled width
 * computed as a percentage of the whole bar minus ten. None of those three
 * numbers knew where the circles actually were, so the line met them at a
 * different place at every width and the whole row read as misaligned. Equal
 * columns put each circle at a known fraction of the bar, and the line is drawn
 * between the first and last centre — which is exactly what those fractions
 * give.
 */
export function ProgressBar({ currentStep }: ProgressBarProps) {
  const columns = STEPS.length;
  // Half a column at each end is the distance from the bar's edge to the centre
  // of the first and last circles.
  const inset = `${100 / (columns * 2)}%`;
  const filled = `${(currentStep / (columns - 1)) * 100}%`;

  return (
    <div className="w-full mb-8">
      <div className="relative">
        {/* Both lines sit at the circles' vertical centre: the circle is 32px
            tall, so its centre is 16px down, and the rule is 2px thick. */}
        <div
          className="absolute top-[15px] h-0.5 bg-border"
          style={{ left: inset, right: inset }}
          aria-hidden
        />
        <div
          className="absolute top-[15px] h-0.5 bg-primary transition-all duration-500 ease-out"
          style={{ left: inset, width: `calc((100% - ${inset} * 2) * ${filled})` }}
          aria-hidden
        />

        <ol
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const Icon = step.icon;

            return (
              <li
                key={step.label}
                className="flex flex-col items-center gap-2 min-w-0"
                aria-current={isActive ? "step" : undefined}
              >
                <span
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
                    // Solid, not a gradient: across 32px a two-colour gradient reads as
                    // whichever end won, so the finished steps and the current one
                    // looked like different colours.
                    (isCompleted || isActive) && "bg-primary text-[color:var(--primary-foreground)]",
                    // A ring rather than a bigger circle: growing the active one
                    // pushed it off the line the others sit on.
                    isActive && "ring-4 ring-primary/20",
                    !isCompleted && !isActive && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </span>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium text-center leading-tight px-0.5",
                    isActive && "text-primary",
                    isCompleted && "text-foreground",
                    !isCompleted && !isActive && "text-muted-foreground",
                    // On a phone only the current step is named; the others are
                    // still there, holding their column, so nothing shifts.
                    isActive ? "block" : "hidden sm:block"
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
