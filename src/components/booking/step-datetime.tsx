"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import gsap from "gsap";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { useBookingStore } from "@/stores/booking-store";
import { TimeSlotGrid } from "./time-slot-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AvailableDate {
  date: string;
  hasSlots: boolean;
}

interface SlotData {
  time: string;
  display: string;
  available: boolean;
}

export function StepDatetime({ slug }: { slug: string }) {
  const { staffId, serviceId, serviceDuration, date, time, setDateTime, setStep } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  const slotsRef = useRef<HTMLDivElement>(null);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  // Fetch available dates
  const { data: availableDates, isLoading: loadingDates } = useSWR<AvailableDate[]>(
    staffId ? `/api/businesses/${slug}/availability?staffId=${staffId}` : null
  );

  // Fetch slots for selected date
  const { data: slots, isLoading: loadingSlots } = useSWR<SlotData[]>(
    dateStr && staffId && serviceId && serviceDuration
      ? `/api/businesses/${slug}/availability/slots?staffId=${staffId}&date=${dateStr}&serviceId=${serviceId}&duration=${serviceDuration}`
      : null
  );

  // Build set of available dates for calendar
  const availableDateSet = new Set(
    availableDates?.filter((d) => d.hasSlots).map((d) => format(new Date(d.date), "yyyy-MM-dd")) ?? []
  );

  // Animate slots in
  useEffect(() => {
    if (!slotsRef.current || !slots) return;
    gsap.fromTo(
      slotsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
    );
    gsap.fromTo(
      slotsRef.current.querySelectorAll(".time-slot-pill"),
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.3, stagger: 0.03, ease: "back.out(1.2)" }
    );
  }, [slots]);

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
  };

  const handleTimeSelect = (timeIso: string, display: string) => {
    if (!selectedDate) return;
    setDateTime(format(selectedDate, "yyyy-MM-dd"), display);
  };

  const canContinue = date && time;

  return (
    <div>
      <h2 className="text-xl font-heading font-bold mb-1">Elegir fecha y hora</h2>
      <p className="text-sm text-muted-foreground mb-6">Selecciona cuando queres tu turno</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="glass rounded-xl p-4">
          {loadingDates ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={es}
              disabled={(d) => {
                const key = format(d, "yyyy-MM-dd");
                const today = format(new Date(), "yyyy-MM-dd");
                return key < today || !availableDateSet.has(key);
              }}
              modifiers={{
                available: (d) => availableDateSet.has(format(d, "yyyy-MM-dd")),
              }}
              modifiersClassNames={{
                available: "font-bold",
              }}
              className="w-full"
            />
          )}
        </div>

        {/* Time slots */}
        <div>
          {!selectedDate && (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-muted-foreground">Selecciona una fecha para ver los horarios</p>
            </div>
          )}

          {selectedDate && loadingSlots && (
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {selectedDate && slots && (
            <div ref={slotsRef}>
              <p className="text-sm font-medium mb-3 capitalize">
                {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <TimeSlotGrid
                slots={slots}
                selectedTime={time ? slots.find((s) => s.display === time)?.time ?? null : null}
                onSelect={handleTimeSelect}
              />
            </div>
          )}
        </div>
      </div>

      {canContinue && (
        <div className="flex justify-end mt-6">
          <Button
            onClick={() => setStep(3)}
            className="brand-gradient text-white border-0 rounded-xl px-6 gap-2"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
