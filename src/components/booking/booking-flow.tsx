"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { addDays, format, parseISO, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Kanji } from "@/components/brand/kanji";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookingStore } from "@/stores/booking-store";
import { formatCurrency } from "@/lib/format";
import { errorMessage } from "@/lib/api-message";
import { cn } from "@/lib/utils";

import { BookingStatusCard } from "./booking-status-card";
import { CouponInput } from "./coupon-input";
import { DateStrip, SlotGroups, type Slot } from "./slot-picker";
import { WaitlistForm } from "./waitlist-form";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
}
interface Category {
  id: string;
  name: string;
  services: Service[];
}
interface StaffMember {
  id: string;
  name: string;
  specialty: string | null;
}
interface PaymentConfig {
  paymentMode: "DISABLED" | "FULL" | "PERCENTAGE" | "FIXED";
  depositPercentage: number | null;
  depositFixedAmount: number | null;
  currency: string;
}

/** How many days the strip offers. Six fits 390px without scrolling. */
const DAYS = 6;

function depositFor(price: number, config: PaymentConfig | undefined): number {
  if (!config) return 0;
  switch (config.paymentMode) {
    case "FULL":
      return price;
    case "PERCENTAGE":
      return Math.round(price * ((config.depositPercentage || 50) / 100));
    case "FIXED":
      return Math.min(config.depositFixedAmount || 0, price);
    default:
      return 0;
  }
}

function depositLabel(config: PaymentConfig | undefined): string {
  if (!config) return "Seña";
  if (config.paymentMode === "FULL") return "Pago total";
  if (config.paymentMode === "PERCENTAGE") return `Seña ahora (${config.depositPercentage}%)`;
  return "Seña ahora";
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

/**
 * The whole booking, on one screen.
 *
 * It replaces a five-step wizard — servicio, profesional, fecha, datos,
 * confirmar — where each step was a full page transition and the customer could
 * not see what they had already chosen. All three choices are visible at once
 * now, and the summary on the right updates as they are made. The customer's
 * details are asked for last, in the summary, because asking for a phone number
 * before showing a free slot is asking for it before there is a reason to give
 * it.
 */
export function BookingFlow({
  businessId,
  slug,
  cancellationPolicy,
}: {
  businessId: string;
  slug: string;
  cancellationPolicy: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const store = useBookingStore();

  const [submitting, setSubmitting] = useState(false);
  const [slotTaken, setSlotTaken] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  // The failure back_url from MercadoPago lands here. Nothing used to read it,
  // so a rejected card returned the customer to a form with no explanation.
  const [paymentFailed, setPaymentFailed] = useState(searchParams.get("error") === "payment");

  const preselected = searchParams.get("serviceId");
  const appliedPreselection = useRef(false);

  // Both public endpoints answer with a bare array, not an envelope.
  const { data: categories, isLoading: loadingServices } = useSWR<Category[]>(
    `/api/businesses/${slug}/services`
  );
  const { data: staffList } = useSWR<StaffMember[]>(
    store.serviceId ? `/api/businesses/${slug}/staff?serviceId=${store.serviceId}` : null
  );
  const { data: paymentConfig } = useSWR<PaymentConfig>(`/api/businesses/${slug}/payment-config`);

  const services = useMemo(
    () => (categories ?? []).flatMap((category) => category.services),
    [categories]
  );
  const staff = staffList ?? [];

  useEffect(() => {
    store.setBusiness(businessId, slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, slug]);

  // A service link from the shop's page or from Instagram lands with the choice
  // already made; applying it once means a customer who then picks something
  // else does not get bounced back.
  useEffect(() => {
    if (appliedPreselection.current || !preselected || services.length === 0) return;
    const service = services.find((item) => item.id === preselected);
    if (service) {
      appliedPreselection.current = true;
      store.setService(service.id, service.name, service.duration, service.price);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselected, services]);

  const { data: availability, isLoading: loadingDates } = useSWR<
    { date: string; hasSlots: boolean }[]
  >(
    store.staffId && store.serviceId && store.serviceDuration
      ? `/api/businesses/${slug}/availability?staffId=${store.staffId}&serviceId=${store.serviceId}&duration=${store.serviceDuration}`
      : null
  );

  const dateStr = store.date;
  const {
    data: slots,
    isLoading: loadingSlots,
    mutate: revalidateSlots,
  } = useSWR<Slot[]>(
    dateStr && store.staffId && store.serviceId && store.serviceDuration
      ? `/api/businesses/${slug}/availability/slots?staffId=${store.staffId}&date=${dateStr}&serviceId=${store.serviceId}&duration=${store.serviceDuration}`
      : null
  );

  const { data: suggestion } = useSWR<{ dayOfWeek: number; time: string } | null>(
    session?.user && store.serviceId && store.staffId
      ? `/api/businesses/${slug}/suggestions?serviceId=${store.serviceId}&staffId=${store.staffId}`
      : null
  );

  // Only asked of somebody signed in who has no number on file; once saved,
  // this never appears again.
  const { data: profile } = useSWR<{ phone: string | null }>(
    session?.user ? "/api/account/profile" : null
  );
  const needsPhone = Boolean(session?.user) && profile !== undefined && !profile?.phone;

  const availableDates = useMemo(() => {
    const withSlots = new Set(
      (availability ?? [])
        .filter((entry) => entry.hasSlots)
        .map((entry) => format(parseISO(entry.date), "yyyy-MM-dd"))
    );
    return Array.from({ length: DAYS }, (_, index) => {
      const date = startOfDay(addDays(new Date(), index));
      return { date, hasSlots: withSlots.has(format(date, "yyyy-MM-dd")) };
    });
  }, [availability]);

  // As soon as the shop's calendar is known, open on the first day that has
  // something free — the customer came to find the soonest slot, not to click
  // through empty days looking for it.
  useEffect(() => {
    if (store.date || !availability) return;
    const first = availableDates.find((day) => day.hasSlots);
    if (first) store.setDateTime(format(first.date, "yyyy-MM-dd"), "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availability, availableDates]);

  const freeSlots = (slots ?? []).filter((slot) => slot.available);
  const price = store.servicePrice ?? 0;
  const discount = store.discountAmount ?? 0;
  const total = Math.max(price - discount, 0);
  const deposit = depositFor(total, paymentConfig);
  const ready = Boolean(store.serviceId && store.staffId && store.date && store.time);

  const suggestionText = useMemo(() => {
    if (!suggestion) return null;
    const days = ["domingos", "lunes", "martes", "miércoles", "jueves", "viernes", "sábados"];
    return `Tu horario habitual: ${days[suggestion.dayOfWeek]} ${suggestion.time}`;
  }, [suggestion]);

  async function confirm() {
    if (submitting || !ready) return;

    const guestName = store.guestName?.trim();
    const guestPhone = store.guestPhone?.trim();
    if (!session?.user && (!guestName || !guestPhone)) {
      toast.error("Necesitamos tu nombre y tu teléfono para reservar.");
      return;
    }
    /*
      Booking with a session used to send no phone number at all — the field was
      only rendered for guests — so the shop had no way of reaching whoever was
      coming. Asked once, then remembered on the profile.
    */
    if (session?.user && needsPhone && !guestPhone) {
      toast.error("Necesitamos tu teléfono para que el local pueda avisarte.");
      return;
    }

    setSubmitting(true);
    setPaymentFailed(false);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: store.serviceId,
          staffId: store.staffId,
          dateTime: `${store.date}T${store.time}`,
          notes: store.notes || undefined,
          couponCode: store.couponCode || undefined,
          referralCode: store.referralCode || undefined,
          ...(session?.user
            ? { phone: guestPhone || undefined }
            : {
                guest: {
                  name: guestName,
                  phone: guestPhone,
                  email: store.guestEmail?.trim() || undefined,
                },
              }),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // The one failure that is not the customer's fault and not ours: someone
        // else took the slot between the page loading and the button being
        // pressed. The cached slots are stale by definition, so they go first.
        if (res.status === 409) {
          store.setDateTime(store.date!, "");
          await revalidateSlots();
          setSlotTaken(true);
          return;
        }
        toast.error(body.error ?? (await errorMessage(res)));
        return;
      }

      const data = await res.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      router.push(`/${slug}/reservar/confirmacion?appointmentId=${data.id}`);
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (slotTaken) {
    return (
      <div className="mx-auto max-w-[560px] px-[18px] pb-16 lg:px-12">
        <BookingStatusCard
          icon="!"
          title="Ese horario se acaba de ocupar"
          actions={freeSlots.slice(0, 3).map((slot) => (
            <button
              key={slot.time}
              type="button"
              onClick={() => {
                store.setDateTime(store.date!, slot.display);
                setSlotTaken(false);
              }}
              className="rounded-[10px] border border-border bg-card px-[18px] py-2.5 text-[13px] font-semibold transition-colors hover:border-primary hover:text-jade-label"
            >
              {slot.display}
            </button>
          ))}
          footnote={
            <>
              o{" "}
              <button
                type="button"
                onClick={() => {
                  setSlotTaken(false);
                  setShowWaitlist(true);
                }}
                className="font-semibold text-jade-link hover:underline"
              >
                anotate en la lista de espera
              </button>
            </>
          }
        >
          {freeSlots.length > 0
            ? "Alguien lo reservó segundos antes que vos. Te dejamos los horarios más cercanos que siguen libres:"
            : "Alguien lo reservó segundos antes que vos, y no queda ningún otro hueco ese día."}
        </BookingStatusCard>
      </div>
    );
  }

  return (
    <div className="relative px-[18px] pb-[150px] lg:px-12 lg:pb-11">
      <div className="relative mx-auto grid max-w-[1104px] gap-5 lg:grid-cols-[1fr_340px]">
        <Kanji
          size={110}
          opacity={0.12}
          className="left-auto right-0 top-0 hidden translate-x-0 translate-y-0 lg:block"
        />

        {/* Mobile progress: service, professional, time. */}
        <div className="mb-3.5 flex gap-[5px] lg:hidden">
          {[store.serviceId, store.staffId, store.time].map((done, index) => (
            <span
              key={index}
              className={cn("h-1 flex-1 rounded-full", done ? "bg-primary" : "bg-border")}
            />
          ))}
        </div>

        <div className="min-w-0">
          {paymentFailed && (
            <BookingStatusCard
              tone="danger"
              icon="×"
              title="No pudimos cobrar la seña"
              className="mb-5"
              actions={
                <button
                  type="button"
                  onClick={() => setPaymentFailed(false)}
                  className="rounded-[10px] bg-primary px-6 py-3 text-[12.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
                >
                  Elegir el horario de nuevo
                </button>
              }
            >
              Mercado Pago rechazó el pago y tu turno no quedó agendado. Podés elegir el horario otra
              vez y probar con otro medio de pago.
            </BookingStatusCard>
          )}

          <Step number={1} title="Elegí tu servicio" />
          {loadingServices ? (
            <div className="mb-[26px] grid gap-[9px] sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[74px] rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="mb-[26px] grid gap-[9px] sm:grid-cols-2">
              {services.map((service) => {
                const active = service.id === store.serviceId;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      store.setService(service.id, service.name, service.duration, service.price);
                      store.setStaff("", "");
                      store.setDateTime("", "");
                    }}
                    aria-pressed={active}
                    className={cn(
                      "rounded-xl bg-card p-[15px] text-left transition-colors",
                      active
                        ? "border-2 border-primary shadow-[0_6px_18px_-8px_rgba(74,222,128,0.4)]"
                        : "border border-border hover:border-faint"
                    )}
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn("text-[13.5px]", active ? "font-bold" : "font-semibold")}
                      >
                        {service.name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-sm",
                          active ? "font-extrabold text-jade-label" : "font-bold text-muted-foreground"
                        )}
                      >
                        {formatCurrency(service.price)}
                      </span>
                    </span>
                    <span className="mt-[3px] block text-[11px] text-muted-foreground">
                      {service.duration} min
                      {service.description ? ` · ${service.description}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {store.serviceId && (
            <>
              <Step number={2} title="¿Con quién?" />
              <div className="mb-[26px] flex flex-wrap gap-[9px]">
                {staff.map((member) => {
                  const active = member.id === store.staffId;
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        store.setStaff(member.id, member.name);
                        store.setDateTime("", "");
                      }}
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-[9px] rounded-full bg-card px-4 py-2.5 transition-colors",
                        active ? "border-2 border-primary" : "border border-border hover:border-faint"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-[26px] items-center justify-center rounded-full text-[9px] font-bold",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {initials(member.name)}
                      </span>
                      <span
                        className={cn(
                          "text-[12.5px]",
                          active ? "font-semibold" : "text-muted-foreground"
                        )}
                      >
                        {member.name}
                      </span>
                    </button>
                  );
                })}
                {staff.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      store.setStaff("any", "Cualquiera");
                      store.setDateTime("", "");
                    }}
                    aria-pressed={store.staffId === "any"}
                    className={cn(
                      "rounded-full bg-card px-4 py-2.5 text-[12.5px] transition-colors",
                      store.staffId === "any"
                        ? "border-2 border-primary font-semibold"
                        : "border border-border text-muted-foreground hover:border-faint"
                    )}
                  >
                    Cualquiera
                  </button>
                )}
              </div>
            </>
          )}

          {store.staffId && (
            <>
              <Step number={3} title="¿Cuándo?" />
              <DateStrip
                days={availableDates}
                selected={store.date ? parseISO(store.date) : null}
                onSelect={(date) => store.setDateTime(format(date, "yyyy-MM-dd"), "")}
                loading={loadingDates}
              />
              <SlotGroups
                slots={slots ?? []}
                idle={!store.date}
                selected={store.time}
                onSelect={(slot) => store.setDateTime(store.date!, slot.display)}
                loading={loadingSlots}
                suggestion={suggestionText}
                empty={
                  <BookingStatusCard
                    icon="!"
                    title="No queda nada libre ese día"
                    actions={
                      <button
                        type="button"
                        onClick={() => setShowWaitlist(true)}
                        className="rounded-[10px] bg-primary px-6 py-3 text-[12.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
                      >
                        Avisame cuando haya lugar
                      </button>
                    }
                  >
                    Probá con otro día del strip, o dejanos tu número y te avisamos apenas se libere
                    un horario.
                  </BookingStatusCard>
                }
              />

              {showWaitlist && store.date && store.serviceId && (
                <WaitlistForm
                  slug={slug}
                  serviceId={store.serviceId}
                  staffId={store.staffId === "any" ? null : store.staffId}
                  preferredDate={store.date}
                  onDone={() => setShowWaitlist(false)}
                />
              )}
            </>
          )}
        </div>

        <BookingSummary
          ready={ready}
          submitting={submitting}
          total={total}
          price={price}
          discount={discount}
          deposit={deposit}
          depositLabel={depositLabel(paymentConfig)}
          slug={slug}
          cancellationPolicy={cancellationPolicy}
          isGuest={!session?.user}
          needsPhone={needsPhone}
          onConfirm={confirm}
        />
      </div>
    </div>
  );
}

function Step({ number, title }: { number: number; title: string }) {
  return (
    <h2 className="mb-3 text-sm font-bold">
      <span className="font-mono text-jade-link">{number}</span> · {title}
    </h2>
  );
}

function BookingSummary({
  ready,
  submitting,
  total,
  price,
  discount,
  deposit,
  depositLabel,
  slug,
  cancellationPolicy,
  isGuest,
  needsPhone,
  onConfirm,
}: {
  ready: boolean;
  submitting: boolean;
  total: number;
  price: number;
  discount: number;
  deposit: number;
  depositLabel: string;
  slug: string;
  cancellationPolicy: string | null;
  isGuest: boolean;
  needsPhone: boolean;
  onConfirm: () => void;
}) {
  const store = useBookingStore();
  const policy = cancellationPolicy?.trim() || "Cancelación gratis hasta 24 h antes.";
  const when =
    store.date && store.time
      ? `${format(parseISO(store.date), "EEE d MMM", { locale: es })} · ${store.time}`
      : null;

  const cta = (
    <button
      type="button"
      onClick={onConfirm}
      disabled={!ready || submitting}
      className="flex w-full items-center justify-center gap-2 rounded-[11px] bg-primary py-[15px] text-sm font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] disabled:cursor-not-allowed disabled:opacity-50 lg:rounded-[10px] lg:py-3.5 lg:text-[13.5px]"
    >
      {submitting ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Procesando con Mercado Pago…
        </>
      ) : deposit > 0 ? (
        "Confirmar y señar"
      ) : (
        "Confirmar el turno"
      )}
    </button>
  );

  return (
    <>
      {/* Desktop: a card that follows you down the page. */}
      <aside className="hidden lg:block">
        <div className="sticky top-5 rounded-2xl border border-border bg-card p-[22px] shadow-[0_12px_32px_-16px_rgba(9,9,11,0.15)]">
          <h2 className="mb-4 text-[13px] font-bold">Tu reserva</h2>

          <dl className="mb-4 flex flex-col gap-[11px] text-[12.5px]">
            <Row label="Servicio" value={store.serviceName} />
            <Row label="Profesional" value={store.staffName} />
            <Row label="Fecha" value={when} />
          </dl>

          {/*
            Only once there is a time to hold. Three empty fields under an empty
            summary is a form asking for a phone number before it has offered
            anything in return.
          */}
          {isGuest && ready && <GuestFields />}
          {!isGuest && needsPhone && ready && <SignedInPhoneField />}

          <div className="mb-[18px] border-t border-dashed border-border pt-3.5">
            {discount > 0 && (
              <div className="mb-1.5 flex justify-between text-[12.5px]">
                <span className="text-muted-foreground">Descuento</span>
                <span className="font-semibold text-jade-label">−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="mb-1.5 flex justify-between text-[12.5px]">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold">{formatCurrency(discount > 0 ? total : price)}</span>
            </div>
            {deposit > 0 && (
              <div className="flex items-baseline justify-between text-[12.5px]">
                <span className="text-muted-foreground">{depositLabel}</span>
                <span className="text-[15px] font-extrabold text-jade-label">
                  {formatCurrency(deposit)}
                </span>
              </div>
            )}
          </div>

          {store.serviceId && <CouponInput slug={slug} serviceId={store.serviceId} />}
          <div className="mt-3">{cta}</div>

          <p className="mt-2.5 text-center text-[10.5px] leading-[1.5] text-faint">
            {deposit > 0 && (
              <>
                Pagás con Mercado Pago.
                <br />
              </>
            )}
            {policy}
          </p>
        </div>
      </aside>

      {/* Phone: a fixed bar with the money and the button. */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-[18px] pt-3 backdrop-blur-xl [--safe-bottom:16px] lg:hidden">
        {isGuest && ready && (
          <div className="mb-2.5">
            <GuestFields compact />
          </div>
        )}
        {!isGuest && needsPhone && ready && (
          <div className="mb-2.5">
            <SignedInPhoneField compact />
          </div>
        )}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10.5px] text-faint">{when ?? "Elegí día y horario"}</p>
            <p className="text-sm font-extrabold">
              {deposit > 0 ? (
                <>
                  Seña <span className="text-jade-label">{formatCurrency(deposit)}</span>{" "}
                  <span className="text-[10.5px] font-normal text-faint">
                    de {formatCurrency(discount > 0 ? total : price)}
                  </span>
                </>
              ) : (
                formatCurrency(discount > 0 ? total : price)
              )}
            </p>
          </div>
          {/*
            Not shrink-0: a shop can write a three-line cancellation policy, and
            an unshrinkable paragraph in a fixed bar pushes the whole bar past
            the screen. It wraps and gives up half the row at most.
          */}
          <p className="line-clamp-3 max-w-[45%] text-right text-[9.5px] leading-tight text-faint">
            {policy}
          </p>
        </div>
        {cta}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("truncate text-right font-semibold", !value && "text-disabled")}>
        {value || "—"}
      </dd>
    </div>
  );
}

/**
 * The one thing a signed-in customer's account does not already know.
 *
 * Their name and their address come from the session; a phone number never did,
 * because the form that asks for one was only ever rendered for guests. The
 * shop was left unable to call whoever was coming.
 */
function SignedInPhoneField({ compact }: { compact?: boolean }) {
  const store = useBookingStore();
  const id = compact ? "reserva-telefono-cuenta-movil" : "reserva-telefono-cuenta";

  return (
    <div className={cn("flex flex-col gap-1", compact ? "mb-0" : "mb-4")}>
      <label className="sr-only" htmlFor={id}>
        Tu teléfono
      </label>
      <input
        id={id}
        className={cn(
          "w-full rounded-[10px] border border-border bg-background px-3 text-[12.5px] outline-none transition-colors focus:border-primary",
          compact ? "h-9" : "h-10"
        )}
        placeholder="Tu teléfono, por si el local necesita avisarte"
        inputMode="tel"
        autoComplete="tel"
        value={store.guestPhone ?? ""}
        onChange={(event) =>
          store.setGuestInfo(store.guestName ?? "", event.target.value, store.guestEmail ?? "")
        }
      />
    </div>
  );
}

/**
 * Asked for at the end, not at the start.
 *
 * The wizard collected the name, phone and email as step four of five — before
 * the customer had seen a single free slot. Here it is the last thing between a
 * chosen time and the button.
 */
function GuestFields({ compact }: { compact?: boolean }) {
  const store = useBookingStore();
  /*
    Both copies of this block are in the DOM at once — the sidebar for desktop
    and the fixed bar for phones — and they shared their ids, so each `<label
    for>` pointed at two elements and a screen reader was told the wrong one.
  */
  const suffix = compact ? "-movil" : "";
  const field = cn(
    "w-full rounded-[10px] border border-border bg-background px-3 text-[12.5px] outline-none transition-colors focus:border-primary",
    compact ? "h-9" : "h-10"
  );

  return (
    <div
      className={cn(
        "mb-4 flex flex-col gap-2",
        // The two-column phone layout needs min-w-0 on the inputs, or the
        // placeholder's intrinsic width pushes the fixed bar past the screen.
        compact && "mb-0 grid grid-cols-2 gap-2 [&>input]:min-w-0"
      )}
    >
      <label className="sr-only" htmlFor={`reserva-nombre${suffix}`}>
        Tu nombre
      </label>
      <input
        id={`reserva-nombre${suffix}`}
        className={field}
        placeholder="Tu nombre"
        autoComplete="name"
        value={store.guestName ?? ""}
        onChange={(e) => store.setGuestInfo(e.target.value, store.guestPhone ?? "", store.guestEmail ?? "")}
      />
      <label className="sr-only" htmlFor={`reserva-telefono${suffix}`}>
        Tu teléfono
      </label>
      <input
        id={`reserva-telefono${suffix}`}
        className={field}
        placeholder="Tu teléfono"
        inputMode="tel"
        autoComplete="tel"
        value={store.guestPhone ?? ""}
        onChange={(e) => store.setGuestInfo(store.guestName ?? "", e.target.value, store.guestEmail ?? "")}
      />
      <label className="sr-only" htmlFor={`reserva-email${suffix}`}>
        Tu email
      </label>
      <input
        id={`reserva-email${suffix}`}
        className={cn(field, compact && "col-span-2")}
        placeholder="Tu email (para la confirmación)"
        type="email"
        autoComplete="email"
        value={store.guestEmail ?? ""}
        onChange={(e) => store.setGuestInfo(store.guestName ?? "", store.guestPhone ?? "", e.target.value)}
      />
    </div>
  );
}
