"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarPlus,
  Compass,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  RotateCcw,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { RescheduleModal } from "@/components/booking/reschedule-modal";
import { NextAppointmentCard } from "@/components/account/next-appointment";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { downloadICS } from "@/lib/ics-generator";
import { statusStyle } from "@/lib/appointment-status";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  dateTime: string;
  status: string;
  serviceId: string;
  staffId: string;
  service: { id: string; name: string; duration: number; price: number };
  staff: { id: string; name: string };
  business: { name: string; slug: string; address: string | null };
  payment?: { status: string; amount: number } | null;
}

interface Identity {
  email: string | null;
  name: string | null;
  via: "session" | "booking" | "link";
}

type Step = "checking" | "identify" | "sent" | "ready";

const primaryButton =
  "flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-[12.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] disabled:opacity-50";

/**
 * A customer's appointments, from every shop, without an account.
 *
 * Nothing here asks anybody to type a code. Booking hands the browser a session
 * outright, so finishing a reservation and landing on this page is one tap;
 * coming back from a different phone means opening one link from one email.
 */
export function AppointmentsPortal() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("checking");
  const [identifier, setIdentifier] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState(
    params.get("link") === "vencido" ? "Ese link ya venció. Te mandamos otro." : ""
  );
  const [busy, setBusy] = useState(false);

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);

  const ready = step === "ready";
  const upcoming = useSWR<{ data: Appointment[]; identity: Identity }>(
    ready ? "/api/client/appointments?scope=upcoming&limit=20" : null
  );
  const past = useSWR<{ data: Appointment[] }>(
    ready ? "/api/client/appointments?scope=past&limit=10" : null
  );

  // Whoever arrives with a session — from signing in, from booking, or from the
  // emailed link — should never see the form at all.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/client/session")
      .then((res) => res.json())
      .then((data: { identified: boolean }) => {
        if (!cancelled) setStep(data.identified ? "ready" : "identify");
      })
      .catch(() => {
        if (!cancelled) setStep("identify");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendLink = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/client/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos mandarte el link.");
        return;
      }
      setSentTo(data.email);
      setStep("sent");
    } catch {
      setError("No hay conexión. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    const res = await fetch(`/api/client/appointments/${cancelling.id}`, { method: "PATCH" });
    setCancelling(null);
    if (res.ok) await Promise.all([upcoming.mutate(), past.mutate()]);
  };

  const leave = async () => {
    await fetch("/api/client/auth/logout", { method: "POST" });
    setStep("identify");
    setIdentifier("");
    router.refresh();
  };

  if (step === "checking") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-faint" aria-label="Cargando" />
      </div>
    );
  }

  if (step === "sent") {
    return (
      <div className="mx-auto max-w-[430px] px-[22px] py-12 text-center">
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-jade-fill">
            <MailCheck className="size-6 text-jade-label" aria-hidden />
          </div>
          <h1 className="text-lg font-bold tracking-[-0.02em]">Revisá tu email</h1>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            {sentTo
              ? `Le mandamos un link a ${sentTo}. Abrilo y entrás derecho a tus turnos.`
              : "Si hay turnos con ese dato, te mandamos un link para entrar. Revisá tu casilla."}
          </p>
          <button
            type="button"
            onClick={() => {
              setStep("identify");
              setError("");
            }}
            className="mt-5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Usar otro email
          </button>
        </div>
      </div>
    );
  }

  if (step === "identify") {
    return (
      <div className="mx-auto max-w-[430px] px-[22px] py-12">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-jade-fill">
              <Mail className="size-6 text-jade-label" aria-hidden />
            </div>
            <h1 className="text-lg font-bold tracking-[-0.02em]">Tus turnos</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Poné el email con el que reservaste y te mandamos un link para entrar.
            </p>
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (identifier.trim() && !busy) void sendLink();
            }}
          >
            <Input
              type="text"
              name="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="send"
              placeholder="tunombre@email.com"
              aria-label="Tu email o tu teléfono"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="text-center"
            />
            {error && (
              <p role="alert" className="text-center text-[12px] text-danger-foreground">
                {error}
              </p>
            )}
            <button type="submit" disabled={!identifier.trim() || busy} className={primaryButton}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="size-4" aria-hidden />
              )}
              Mandame el link
            </button>
            <p className="text-center text-[11px] text-faint">
              También sirve tu teléfono, si reservaste con él.
            </p>
          </form>
        </div>

        <p className="mt-5 text-center text-[12px] text-muted-foreground">
          ¿Todavía no reservaste?{" "}
          <Link href="/explorar" className="font-semibold text-jade-link hover:underline">
            Explorá los locales
          </Link>
        </p>
      </div>
    );
  }

  const identity = upcoming.data?.identity;
  const upcomingList = upcoming.data?.data ?? [];
  const pastList = past.data?.data ?? [];
  const [next, ...rest] = upcomingList;
  const loading = upcoming.isLoading;

  return (
    <div className="mx-auto max-w-3xl px-[22px] py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[21px] font-bold tracking-[-0.025em]">Mis turnos</h1>
          <p className="mt-[3px] text-[12.5px] text-muted-foreground">
            Todo lo que reservaste, en todos los locales.
          </p>
        </div>
        <Link
          href="/explorar"
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-border px-4 py-2 text-[12px] font-semibold transition-colors hover:border-faint"
        >
          <Compass className="size-3.5" aria-hidden />
          Reservar en otro local
        </Link>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-faint" aria-label="Cargando" />
        </div>
      ) : upcomingList.length === 0 && pastList.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-14 text-center">
          <p className="text-[15px] font-bold">Todavía no tenés turnos</p>
          <p className="mx-auto mt-1.5 max-w-[42ch] text-[12.5px] text-muted-foreground">
            Cuando reserves en un local, el turno te va a aparecer acá con todo lo que necesitás
            para cambiarlo o cancelarlo.
          </p>
          <Link href="/explorar" className={cn(primaryButton, "mx-auto mt-6 w-auto")}>
            <Compass className="size-4" aria-hidden />
            Explorar locales
          </Link>
        </div>
      ) : (
        <>
          {next && (
            <NextAppointmentCard
              appointment={next}
              onReschedule={() => setRescheduling(next)}
              onCancel={() => setCancelling(next)}
            />
          )}

          {rest.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
                Después
              </h2>
              <ul className="space-y-2.5">
                {rest.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onReschedule={() => setRescheduling(appointment)}
                    onCancel={() => setCancelling(appointment)}
                  />
                ))}
              </ul>
            </section>
          )}

          {upcomingList.length === 0 && (
            <div className="mb-8 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-[13px] font-semibold">No tenés turnos próximos</p>
              <Link
                href="/explorar"
                className="mt-2 inline-block text-[12.5px] font-semibold text-jade-link hover:underline"
              >
                Reservar de nuevo
              </Link>
            </div>
          )}

          {pastList.length > 0 && (
            <section>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-faint">
                Anteriores
              </h2>
              <ul className="space-y-2.5">
                {pastList.map((appointment) => (
                  <AppointmentRow key={appointment.id} appointment={appointment} past />
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {identity && <Footer identity={identity} onLeave={leave} />}

      {identity?.via !== "session" && <CreatePassword email={identity?.email ?? null} />}

      {rescheduling && (
        <RescheduleModal
          appointmentId={rescheduling.id}
          slug={rescheduling.business.slug}
          currentDateTime={rescheduling.dateTime}
          serviceDuration={rescheduling.service.duration}
          serviceId={rescheduling.serviceId}
          staffId={rescheduling.staffId}
          rescheduleUrl={`/api/client/appointments/${rescheduling.id}/reschedule`}
          onClose={() => setRescheduling(null)}
          onSuccess={() => {
            setRescheduling(null);
            void upcoming.mutate();
            void past.mutate();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="¿Cancelar este turno?"
        description={
          cancelling
            ? `${cancelling.service.name} en ${cancelling.business.name}, ${format(
                new Date(cancelling.dateTime),
                "EEEE d 'de' MMMM 'a las' HH:mm",
                { locale: es }
              )}. Le avisamos al local.`
            : ""
        }
        confirmLabel="Sí, cancelar"
        cancelLabel="No, dejarlo"
        destructive
        onConfirm={confirmCancel}
      />
    </div>
  );
}

/**
 * The offer to have an account, for whoever wants one.
 *
 * `/registrarse` cannot make them one: that form asks for a shop name and
 * creates a `Business`, so somebody who only wants to keep track of their
 * haircuts had no way to sign up at all. Deliberately a single line at the
 * foot of the page and not a step in the way — nothing here needs an account,
 * and it is offered after booking rather than before, when there is finally a
 * reason for one.
 */
function CreatePassword({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!email) return null;

  if (done) {
    return (
      <p className="mt-4 text-center text-[11.5px] text-muted-foreground">
        Listo. La próxima entrá con {email} y tu clave desde{" "}
        <Link href="/iniciar-sesion" className="font-semibold text-jade-link hover:underline">
          iniciar sesión
        </Link>
        .
      </p>
    );
  }

  if (!open) {
    return (
      <p className="mt-4 text-center text-[11.5px] text-faint">
        ¿Querés una cuenta para no depender de este teléfono?{" "}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-semibold text-jade-link hover:underline"
        >
          Poné una clave
        </button>
      </p>
    );
  }

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/client/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No pudimos guardar la clave.");
        return;
      }
      setDone(true);
    } catch {
      setError("No hay conexión. Probá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="mx-auto mt-5 max-w-[360px] rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (password.length >= 8 && !busy) void submit();
      }}
    >
      <p className="text-[12.5px] font-bold">Una cuenta para tus turnos</p>
      <p className="mt-1 text-[11.5px] text-muted-foreground">
        Elegí una clave para {email}. Tus turnos quedan guardados igual.
      </p>
      <Input
        type="password"
        autoComplete="new-password"
        placeholder="Al menos 8 caracteres"
        aria-label="Tu clave nueva"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="mt-3"
      />
      {error && (
        <p role="alert" className="mt-2 text-[11.5px] text-danger-foreground">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={password.length < 8 || busy}
        className={cn(primaryButton, "mt-3")}
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Guardar la clave
      </button>
    </form>
  );
}

/**
 * Whose appointments these are, and how to stop showing them.
 *
 * The session lasts a week and plenty of people book from a phone that gets
 * handed around or a computer at work. Without this, the page is somebody's
 * agenda with no indication of whose and no way to close it.
 */
function Footer({ identity, onLeave }: { identity: Identity; onLeave: () => void }) {
  return (
    <footer className="mt-10 border-t border-border-subtle pt-5 text-center text-[11.5px] text-faint">
      <p>
        Estás viendo los turnos de {identity.email}
        {identity.via !== "session" && (
          <>
            {" · "}
            <button type="button" onClick={onLeave} className="underline hover:text-foreground">
              Salir
            </button>
          </>
        )}
      </p>
    </footer>
  );
}

function AppointmentRow({
  appointment,
  past,
  onReschedule,
  onCancel,
}: {
  appointment: Appointment;
  past?: boolean;
  onReschedule?: () => void;
  onCancel?: () => void;
}) {
  const when = new Date(appointment.dateTime);
  const style = statusStyle(appointment.status);

  return (
    <li
      className={cn("rounded-xl border border-border bg-card p-4", past && "border-border-subtle")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="text-[13px] font-bold">{appointment.service.name}</p>
            <span className={cn("rounded-full border px-2 py-[1px] text-[10px]", style.badge)}>
              {style.label}
            </span>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            {appointment.business.name} · con {appointment.staff.name}
          </p>
          <p className="mt-0.5 text-[11.5px] text-faint">
            {format(when, "EEEE d 'de' MMMM · HH:mm", { locale: es })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {past ? (
            <Link
              href={`/${appointment.business.slug}/reservar?serviceId=${appointment.serviceId}&staffId=${appointment.staffId}`}
              className="inline-flex items-center gap-1 rounded-lg bg-jade-fill px-2.5 py-1 text-[11px] font-semibold text-jade-label transition-opacity hover:opacity-80"
            >
              <RotateCcw className="size-3" aria-hidden />
              Volver a reservar
            </Link>
          ) : (
            <>
              <IconButton
                label="Agregar al calendario"
                onClick={() =>
                  downloadICS({
                    title: `${appointment.service.name} — ${appointment.business.name}`,
                    description: `Con ${appointment.staff.name}`,
                    location: appointment.business.address ?? appointment.business.name,
                    start: when,
                    end: new Date(when.getTime() + appointment.service.duration * 60_000),
                  })
                }
              >
                <CalendarPlus className="size-4" aria-hidden />
              </IconButton>
              {onReschedule && (
                <IconButton label="Reprogramar" onClick={onReschedule}>
                  <RefreshCw className="size-4" aria-hidden />
                </IconButton>
              )}
              {onCancel && (
                <IconButton label="Cancelar turno" destructive onClick={onCancel}>
                  <X className="size-4" aria-hidden />
                </IconButton>
              )}
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function IconButton({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted",
        destructive ? "hover:text-danger-foreground" : "hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
