"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, User, ArrowLeft, Loader2, CheckCircle } from "lucide-react";


interface EmbedProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
  businessLogo: string | null;
  primaryColor: string;
}

type Step = "services" | "staff" | "datetime" | "info" | "confirmation";

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
  const [booked, setBooked] = useState(false);

  const { data: servicesData } = useSWR(
    `/api/businesses/${businessSlug}/services`);

  const { data: staffData } = useSWR(
    selectedService ? `/api/businesses/${businessSlug}/staff?serviceId=${selectedService}` : null);

  const { data: slotsData } = useSWR(
    selectedStaff && selectedDate && selectedService
      ? `/api/businesses/${businessSlug}/availability/slots?staffId=${selectedStaff}&date=${selectedDate}&serviceId=${selectedService}`
      : null);

  const services = servicesData?.data || servicesData || [];
  const staffList = staffData?.data || staffData || [];
  const slots = slotsData?.data || slotsData || [];

  async function handleBook() {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;
    setBooking(true);

    try {
      const res = await fetch(`/api/businesses/${businessSlug}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService,
          staffId: selectedStaff,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
          clientEmail: clientEmail || undefined,
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      setBooked(true);
    } catch {
      // Keep on info step
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
            {services.map((s: { id: string; name: string; duration: number; price: number }) => (
              <button
                key={s.id}
                onClick={() => { setSelectedService(s.id); setStep("staff"); }}
                className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
              >
                <p className="font-medium text-sm">{s.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration} min</span>
                  <span>${s.price.toLocaleString("es-AR")}</span>
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
                    <img src={s.image} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
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
                <div className="grid grid-cols-3 gap-2">
                  {(Array.isArray(slots) ? slots : []).map((slot: string | { time: string }) => {
                    const time = typeof slot === "string" ? slot : slot.time;
                    return (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); setStep("info"); }}
                        className="px-3 py-2 text-sm rounded-lg border border-border hover:border-primary/50 transition-colors text-center"
                        style={selectedTime === time ? { backgroundColor: `${primaryColor}20`, borderColor: primaryColor } : {}}
                      >
                        {time}
                      </button>
                    );
                  })}
                  {slots.length === 0 && (
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
              <label className="text-sm text-muted-foreground">Nombre *</label>
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Teléfono *</label>
              <input
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                type="tel"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Email (opcional)</label>
              <input
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                type="email"
                className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>

            <button
              onClick={handleBook}
              disabled={booking || !clientName.trim() || !clientPhone.trim()}
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
