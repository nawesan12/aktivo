import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Kanji } from "@/components/brand/kanji";
import { formatCurrency } from "@/lib/format";
import { safeImageUrl } from "@/lib/images";
import type { Confirmation } from "@/lib/booking/confirmation";

import { AddToCalendar } from "./profile/add-to-calendar";
import { ShareButton } from "./profile/share-button";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * The ticket.
 *
 * It reads the appointment by the id in the URL. The previous version rendered
 * from the Zustand store in sessionStorage and cleared it a second later, so a
 * refresh, a shared link or the return trip from MercadoPago in another tab all
 * landed on a blank page — and `?pending=true`, a payment still being
 * processed, announced "¡Turno confirmado!" regardless.
 */
export function ConfirmationContent({ appointment }: { appointment: Confirmation }) {
  const when = new Date(appointment.dateTime);
  const logo = safeImageUrl(appointment.business.logo);
  const pending = appointment.awaitingPayment;

  return (
    <div className="relative mx-auto min-h-screen max-w-[430px] overflow-hidden bg-[radial-gradient(400px_260px_at_50%_0%,rgba(74,222,128,0.14),transparent_65%)] px-[22px] pb-8 pt-9">
      <div className="bg-dots absolute inset-0 -z-10" aria-hidden />

      <div className="mb-[22px] text-center">
        <Image
          src="/illus/confirmed.svg"
          alt=""
          width={240}
          height={120}
          priority
          className="mx-auto mb-3.5 h-[120px] w-auto"
        />
        <h1 className="mb-1 text-[22px] font-extrabold tracking-[-0.03em]">
          {pending ? "Estamos confirmando el pago" : "¡Turno confirmado!"}
        </h1>
        <p className="text-[12.5px] text-muted-foreground">
          {pending
            ? "Mercado Pago todavía está procesando la seña. Te avisamos por mail apenas se acredite."
            : appointment.clientEmail
              ? "Te mandamos el detalle por mail"
              : "Guardá esta pantalla: sin email no podemos mandarte el detalle"}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_-20px_rgba(9,9,11,0.25)]">
        <div className="p-5 pb-4">
          <div className="mb-4 flex items-center gap-[11px]">
            {logo ? (
              <Image
                src={logo}
                alt=""
                width={38}
                height={38}
                className="size-[38px] rounded-[10px] object-cover"
              />
            ) : (
              <span
                className="flex size-[38px] items-center justify-center rounded-[10px] bg-primary text-[13px] font-extrabold text-primary-foreground"
                aria-hidden
              >
                {initials(appointment.business.name)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-bold">{appointment.business.name}</p>
              {appointment.business.address && (
                <p className="truncate text-[10px] text-faint">{appointment.business.address}</p>
              )}
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3">
            <Field label="Servicio" value={appointment.serviceName} />
            <Field label="Profesional" value={appointment.staffName} />
            <Field
              label="Fecha"
              value={format(when, "EEE d MMM · HH:mm", { locale: es })}
              highlight
            />
            <Field label="Duración" value={`${appointment.duration} min`} />
          </dl>
        </div>

        {/*
          The perforation. Two notches the colour of the page, punched over a
          dashed rule — it is what makes the block read as a ticket rather than
          as another card.
        */}
        <div className="relative mx-2.5 h-px border-t border-dashed border-disabled">
          <span className="absolute -left-[19px] -top-[9px] size-[18px] rounded-full border-r border-border bg-background" />
          <span className="absolute -right-[19px] -top-[9px] size-[18px] rounded-full border-l border-border bg-background" />
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="mb-0.5 text-[9px] uppercase tracking-[0.1em] text-faint">
              {appointment.paid > 0 ? (pending ? "Seña en proceso" : "Seña pagada") : "Total"}
            </p>
            <p className="text-base font-extrabold text-jade-label">
              {formatCurrency(appointment.paid > 0 ? appointment.paid : appointment.price)}
            </p>
            {appointment.paid > 0 && appointment.remaining > 0 && (
              <p className="mt-px text-[9.5px] text-faint">
                Restan {formatCurrency(appointment.remaining)} en el local
              </p>
            )}
          </div>

          {/*
            The reference code, as a block the counter can read at a glance. It
            is not a scannable QR — there is no scanner at the other end — so
            drawing one would be a picture of a feature that does not exist.
          */}
          <p className="shrink-0 rounded-lg bg-muted px-3 py-2 text-center font-mono text-[11px] font-semibold tracking-[0.08em]">
            {appointment.id.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <AddToCalendar appointment={appointment} />
        <div className="flex gap-2.5">
          <Link
            href={`/${appointment.business.slug}/mis-turnos`}
            className={action}
          >
            Reprogramar
          </Link>
          <ShareButton name={appointment.business.name} className={action} />
        </div>
        <p className="mt-1 text-center text-[10.5px] text-faint">
          {appointment.business.cancellationPolicy ?? "Cancelación gratis hasta 24 h antes."}
        </p>
      </div>

      <Kanji size={120} opacity={0.06} className="left-1/2 top-auto bottom-4" />
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="mb-0.5 text-[9px] uppercase tracking-[0.1em] text-faint">{label}</dt>
      <dd
        className={
          highlight ? "text-[12.5px] font-bold text-jade-label" : "text-[12.5px] font-semibold"
        }
      >
        {value}
      </dd>
    </div>
  );
}

const action =
  "flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-border bg-card p-3 text-xs text-muted-foreground transition-colors hover:border-faint";
