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
import { Input } from "@/components/ui/input";
import { ArrowRight, Bell, Loader2, Check, ChevronDown, Repeat } from "lucide-react";

interface AvailableDate {
  date: string;
  hasSlots: boolean;
}

interface SlotData {
  time: string;
  display: string;
  available: boolean;
}

const RECURRENCE_OPTIONS = [
  { value: "WEEKLY" as const, label: "Semanal" },
  { value: "BIWEEKLY" as const, label: "Quincenal" },
  { value: "MONTHLY" as const, label: "Mensual" },
];

export function StepDatetime({ slug }: { slug: string }) {
  const {
    staffId, serviceId, serviceDuration, date, time, setDateTime, setStep,
    recurrenceFrequency, recurrenceCount, setRecurrence,
  } = useBookingStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    date ? new Date(date) : undefined
  );
  const slotsRef = useRef<HTMLDivElement>(null);
  // Waitlist state
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  // Recurrence state
  const [showRecurrence, setShowRecurrence] = useState(false);

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
      <p className="text-sm text-muted-foreground mb-6">Seleccioná cuándo querés tu turno</p>

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

              {/* Waitlist: show when no slots available */}
              {slots.length > 0 && slots.every((s) => !s.available) && !waitlistSuccess && (
                <div className="mt-4">
                  {!showWaitlist ? (
                    <button
                      onClick={() => setShowWaitlist(true)}
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <Bell className="w-4 h-4" />
                      Avisame cuando haya lugar
                    </button>
                  ) : (
                    <div className="glass rounded-xl p-4 space-y-3">
                      <p className="text-sm font-medium">Te avisamos cuando se libere un turno</p>
                      <Input
                        placeholder="Tu nombre"
                        value={waitlistName}
                        onChange={(e) => setWaitlistName(e.target.value)}
                      />
                      <Input
                        placeholder="Tu teléfono"
                        type="tel"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                      />
                      <Button
                        onClick={async () => {
                          setWaitlistLoading(true);
                          try {
                            await fetch(`/api/businesses/${slug}/waitlist`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                name: waitlistName,
                                phone: waitlistPhone,
                                serviceId,
                                staffId,
                                preferredDate: format(selectedDate!, "yyyy-MM-dd"),
                              }),
                            });
                            setWaitlistSuccess(true);
                          } catch {
                            // ignore
                          } finally {
                            setWaitlistLoading(false);
                          }
                        }}
                        disabled={!waitlistName || waitlistPhone.length < 10 || waitlistLoading}
                        className="w-full brand-gradient text-white border-0 rounded-xl gap-2"
                        size="sm"
                      >
                        {waitlistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                        Anotarme
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {waitlistSuccess && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-500">
                  <Check className="w-4 h-4" />
                  Te avisamos cuando se libere un turno
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recurrence selector (Feature 5) */}
      {canContinue && (
        <div className="mt-6 space-y-4">
          <button
            onClick={() => setShowRecurrence(!showRecurrence)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Repetir este turno?
            <ChevronDown className={`w-4 h-4 transition-transform ${showRecurrence ? "rotate-180" : ""}`} />
          </button>

          {showRecurrence && (
            <div className="glass rounded-xl p-4 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Frecuencia</p>
                <div className="flex gap-2">
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setRecurrence(
                        recurrenceFrequency === opt.value ? null : opt.value,
                        recurrenceCount || 4
                      )}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        recurrenceFrequency === opt.value
                          ? "bg-primary text-primary-foreground"
                          : "glass hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {recurrenceFrequency && (
                <div>
                  <p className="text-sm font-medium mb-2">Cantidad de turnos</p>
                  <div className="flex gap-2 flex-wrap">
                    {[2, 3, 4, 6, 8, 12].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRecurrence(recurrenceFrequency, n)}
                        className={`w-10 h-10 rounded-lg text-sm transition-colors ${
                          recurrenceCount === n
                            ? "bg-primary text-primary-foreground"
                            : "glass hover:bg-muted"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(3)}
              className="brand-gradient text-white border-0 rounded-xl px-6 gap-2"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
