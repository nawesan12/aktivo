"use client";

import { useState } from "react";
import useSWR from "swr";
import { Clock, User, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import Image from "next/image";


interface EmbedProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessLogo: string | null;
  primaryColor: string;
}

type Step = "services" | "staff" | "datetime" | "info" | "confirmation";

interface WidgetService {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface WidgetSlot {
  /** Absolute instant, sent back when booking. */
  time: string;
  /** Local label shown to the visitor, e.g. "09:00". */
  display: string;
  available?: boolean;
}

interface ServiceOrCategory extends Partial<WidgetService> {
  id: string;
  name: string;
  services?: WidgetService[];
}

function flattenServices(entries: ServiceOrCategory[]): WidgetService[] {
  return entries.flatMap((entry) =>
    entry.services?.length
      ? entry.services
      : typeof entry.duration === "number" && typeof entry.price === "number"
        ? [{ id: entry.id, name: entry.name, duration: entry.duration, price: entry.price }]
        : []
  );
}

export function EmbedBookingFlow({ businessSlug, businessName, primaryColor }: EmbedProps) {
  const [step, setStep] = useState<Step>("services");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const { data: servicesData } = useSWR(
    `/api/businesses/${businessSlug}/services`);

  const { data: staffData } = useSWR(
    selectedService ? `/api/businesses/${businessSlug}/staff?serviceId=${selectedService}` : null);

  // `/services` returns categories with their services nested, plus any
  // uncategorised service at the top level. The widget was rendering that list
  // straight through, so it offered "Cortes", "Barba" and "Combos" as if they
  // were bookable — each showing "min" with no number and "$ 0".
  const services: WidgetService[] = flattenServices(servicesData?.data || servicesData || []);
  const selectedServiceDuration =
    services.find((s) => s.id === selectedService)?.duration ?? 30;

  // `duration` is required by the endpoint; without it the request 400s and the
  // widget shows an empty list of times with no explanation.
  const { data: slotsData } = useSWR(
    selectedStaff && selectedDate && selectedService
      ? `/api/businesses/${businessSlug}/availability/slots?staffId=${selectedStaff}` +
          `&date=${selectedDate}&serviceId=${selectedService}&duration=${selectedServiceDuration}`
      : null);

  const staffList = staffData?.data || staffData || [];

  const slots: WidgetSlot[] = slotsData?.data || slotsData || [];
  const availableSlots = slots.filter((slot) => slot.available !== false);

  async function handleBook() {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;
    setBooking(true);
    setBookingError(null);

    try {
      // `/api/appointments` is the endpoint that creates bookings. This used to
      // post to `/api/businesses/[slug]/appointments`, which does not exist:
      // every attempt got a 404 that the empty catch below swallowed, so the
      // visitor pressed "confirm" and nothing happened, with no message. The
      // embeddable widget could never book anything.
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          staffId: selectedStaff,
          // The absolute instant of the chosen slot, not its local label.
          dateTime: selectedTime,
          guest: {
            name: clientName,
            phone: clientPhone,
            email: clientEmail || "",
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "No pudimos confirmar el turno. Probá de nuevo.");
      }

      setBooked(true);
    } catch (error) {
      setBookingError(
        error instanceof Error ? error.message : "No pudimos confirmar el turno."
      );
    } finally {
      setBooking(false);
    }
  }

  if (booked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <CheckCircle className="w-16 h-16 mb-4" style={{ color: primaryColor }} />
        <h2 className="text-xl font-bold mb-2">¡Turno Reservado!</h2>
        <p className="text-muted-foreground mb-4">
          Tu turno en {businessName} ha sido confirmado.
        </p>
        <p className="text-sm text-muted-foreground">Powered by Jiku</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        {step !== "services" && (
          <button
            onClick={() => {
              if (step === "staff") setStep("services");
              else if (step === "datetime") setStep("staff");
              else if (step === "info") setStep("datetime");
            }}
            className="p-1 rounded hover:bg-accent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <p className="font-semibold text-sm">{businessName}</p>
          <p className="text-xs text-muted-foreground">
            {step === "services" && "Elegí un servicio"}
            {step === "staff" && "Elegí un profesional"}
            {step === "datetime" && "Elegí fecha y hora"}
            {step === "info" && "Tus datos"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {step === "services" && (
          <div className="space-y-2">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); setStep("staff"); }}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-sm">{s.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration} min</span>
                  <span>{formatCurrency(s.price)}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "staff" && (
          <div className="space-y-2">
            {staffList.map((s: { id: string; name: string; specialty?: string; image?: string }) => (
              <button
                key={s.id}
                onClick={() => { setSelectedStaff(s.id); setStep("datetime"); }}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 transition-colors flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {s.image ? (
                    <Image
                      src={s.image}
                      alt={s.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.specialty && <p className="text-xs text-muted-foreground">{s.specialty}</p>}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "datetime" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Fecha</p>
              <input
                type="date"
                value={selectedDate || ""}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(null); }}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            {selectedDate && (
              <div>
                <p className="text-sm font-medium mb-2">Hora</p>
                {/* `time` is the absolute instant, `display` the local label.
                    The button used to print `time`, so visitors were offered
                    "2026-08-31T12:00:00.000Z" instead of "09:00", and slots
                    already taken looked identical to free ones. */}
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      onClick={() => { setSelectedTime(slot.time); setStep("info"); }}
                      className="px-3 py-2 text-sm rounded-lg border border-border hover:border-primary/50 transition-colors text-center"
                      style={
                        selectedTime === slot.time
                          ? { backgroundColor: `${primaryColor}20`, borderColor: primaryColor }
                          : {}
                      }
                    >
                      {slot.display}
                    </button>
                  ))}
                  {availableSlots.length === 0 && (
                    <p className="col-span-3 text-center text-sm text-muted-foreground py-4">
                      No hay horarios disponibles para esta fecha
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "info" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="nombre" className="text-sm text-muted-foreground">Nombre *</label>
              <input
                id="nombre"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="telefono" className="text-sm text-muted-foreground">Teléfono *</label>
              <input
                id="telefono"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                type="tel"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm text-muted-foreground">Email</label>
              <input
                id="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                type="email"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ahí llega la confirmación y el recordatorio.
              </p>
            </div>

            {bookingError && (
              <p
                role="alert"
                className="text-sm text-danger-foreground bg-danger-muted border border-danger/20 rounded-lg px-3 py-2"
              >
                {bookingError}
              </p>
            )}

            <button
              onClick={handleBook}
              disabled={booking || !clientName.trim() || !clientPhone.trim() || !clientEmail.trim()}
              className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, #22D3EE)` }}
            >
              {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Turno"}
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-muted-foreground py-2 border-t border-border">
        Powered by Jiku
      </p>
    </div>
  );
}
