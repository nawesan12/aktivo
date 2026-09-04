"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Phone, ArrowRight, KeyRound, Calendar, Clock, User, X, Loader2, CalendarPlus, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { downloadICS } from "@/lib/ics-generator";
import { RescheduleModal } from "@/components/booking/reschedule-modal";
import Link from "next/link";
import { statusStyle } from "@/lib/appointment-status";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  serviceId: string;
  staffId: string;
  service: { name: string; duration: number };
  staff: { name: string };
}

interface WaitlistEntry {
  id: string;
  preferredDate: string;
  service: { name: string };
  notified: boolean;
  createdAt: string;
}

type PortalState = "phone" | "code" | "appointments";

export function MisTurnosClient() {
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const [state, setState] = useState<PortalState>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** Masked address the code was sent to, so the person knows which inbox to open. */
  const [codeSentTo, setCodeSentTo] = useState("");
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past, setPast] = useState<Appointment[]>([]);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);

  const handleSendCode = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/guest-auth/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setCodeSentTo(data.email ?? "");
      setState("code");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/guest-auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      await fetchAppointments();
      await fetchWaitlist();
      setState("appointments");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    const res = await fetch(`/api/businesses/${businessSlug}/guest-appointments`);
    const data = await res.json();
    if (res.ok) {
      setUpcoming(data.upcoming);
      setPast(data.past);
    }
  };

  const fetchWaitlist = async () => {
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/waitlist`);
      if (res.ok) {
        const data = await res.json();
        setWaitlistEntries(data.entries || []);
      }
    } catch {
      // Waitlist fetch is optional
    }
  };

  const handleCancel = async (appointmentId: string) => {
    setCancelling(appointmentId);
    try {
      const res = await fetch(`/api/businesses/${businessSlug}/guest-appointments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId }),
      });
      if (res.ok) {
        await fetchAppointments();
      }
    } catch {
      // ignore
    } finally {
      setCancelling(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      {state === "phone" && (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-heading font-bold mb-1">Mis turnos</h1>
            <p className="text-sm text-muted-foreground">
              Ingresá tu teléfono y te mandamos un código por email
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Ej: 1155667788"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-center text-lg"
            />
            {error && <p className="text-sm text-danger-foreground text-center">{error}</p>}
            <Button
              onClick={handleSendCode}
              disabled={phone.length < 10 || loading}
              className="w-full brand-gradient text-white border-0 rounded-xl gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Enviar código
            </Button>
          </div>
        </div>
      )}

      {state === "code" && (
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-xl font-heading font-bold mb-1">Código de verificación</h1>
            <p className="text-sm text-muted-foreground">
              Te enviamos un código por email{codeSentTo ? ` a ${codeSentTo}` : ""}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
            {error && <p className="text-sm text-danger-foreground text-center">{error}</p>}
            <Button
              onClick={handleVerify}
              disabled={code.length !== 6 || loading}
              className="w-full brand-gradient text-white border-0 rounded-xl gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Verificar
            </Button>
            <button
              onClick={() => { setState("phone"); setCode(""); setError(""); }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cambiar número
            </button>
          </div>
        </div>
      )}

      {state === "appointments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-heading font-bold mb-1">Mis turnos</h1>
              <p className="text-sm text-muted-foreground">{phone}</p>
            </div>
            <Link
              href={`/${businessSlug}/mis-turnos/notificaciones`}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              title="Preferencias de notificación"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* Upcoming */}
          <div>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Próximos
            </h2>
            {upcoming.length === 0 ? (
              <div className="glass rounded-xl p-6 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tenés turnos próximos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map((apt) => (
                  <div key={apt.id} className="glass rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{apt.service.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(apt.dateTime), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(apt.dateTime), "HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {apt.staff.name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className={cn("text-xs px-2 py-0.5 rounded-full", statusStyle(apt.status).badge)}>
                          {statusStyle(apt.status).label}
                        </span>
                        {/* Add to calendar */}
                        <button
                          onClick={() => {
                            const start = new Date(apt.dateTime);
                            const end = new Date(start.getTime() + apt.service.duration * 60 * 1000);
                            downloadICS({
                              title: apt.service.name,
                              description: `Turno con ${apt.staff.name}`,
                              start,
                              end,
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                          title="Agregar al calendario"
                        >
                          <CalendarPlus className="w-4 h-4" />
                        </button>
                        {/* Reschedule */}
                        <button
                          onClick={() => setRescheduleAppt(apt)}
                          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                          title="Reprogramar"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        {/* Cancel */}
                        <button
                          onClick={() => handleCancel(apt.id)}
                          disabled={cancelling === apt.id}
                          className="p-1.5 rounded-lg hover:bg-danger-muted text-muted-foreground hover:text-danger-foreground transition-colors"
                          title="Cancelar turno"
                        >
                          {cancelling === apt.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Waitlist */}
          {waitlistEntries.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Lista de espera
              </h2>
              <div className="space-y-2">
                {waitlistEntries.map((entry) => (
                  <div key={entry.id} className="glass rounded-xl p-4 opacity-80">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{entry.service.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Fecha preferida: {format(new Date(entry.preferredDate), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        entry.notified ? "bg-success-muted text-success-foreground" : "bg-warning-muted text-warning-foreground"
                      )}>
                        {entry.notified ? "Notificado" : "En espera"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Anteriores
              </h2>
              <div className="space-y-2">
                {past.map((apt) => (
                  <div key={apt.id} className="glass rounded-xl p-4 opacity-60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{apt.service.name}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(apt.dateTime), "d MMM yyyy", { locale: es })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(apt.dateTime), "HH:mm")}
                          </span>
                        </div>
                      </div>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", statusStyle(apt.status).badge)}>
                        {statusStyle(apt.status).label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleAppt && (
        <RescheduleModal
          appointmentId={rescheduleAppt.id}
          slug={businessSlug}
          currentDateTime={rescheduleAppt.dateTime}
          serviceDuration={rescheduleAppt.service.duration}
          serviceId={rescheduleAppt.serviceId}
          staffId={rescheduleAppt.staffId}
          rescheduleUrl={`/api/businesses/${businessSlug}/guest-appointments/reschedule`}
          onClose={() => setRescheduleAppt(null)}
          onSuccess={() => {
            setRescheduleAppt(null);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
