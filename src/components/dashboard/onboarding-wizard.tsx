"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { JikuLogo } from "@/components/brand/jiku-logo";
import { errorMessage, messageOf } from "@/lib/api-message";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  businessName: string;
  businessId: string;
}

const STEPS = [
  { id: "negocio", label: "Tu negocio" },
  { id: "servicios", label: "Servicios" },
  { id: "horarios", label: "Horarios" },
  { id: "link", label: "Tu link" },
];

/** The three bands a shop actually thinks in, not seven separate days. */
const BANDS = [
  { id: "weekdays", label: "Lun a Vie", days: [1, 2, 3, 4, 5], from: "09:00", to: "20:00" },
  { id: "saturday", label: "Sábado", days: [6], from: "10:00", to: "18:00" },
  { id: "sunday", label: "Domingo", days: [0], from: "10:00", to: "14:00" },
];

const ILLUSTRATIONS = [
  "/illus/booking.svg",
  "/illus/gift.svg",
  "/illus/calendar.svg",
  "/illus/confirmed.svg",
];

/**
 * Four steps, and the third one is new.
 *
 * The wizard used to be profile → service → professional → done, with no hours
 * anywhere. So it created a professional with an empty agenda, the completion
 * check said the business was set up, and the public page offered not one free
 * slot — the shop was live and unbookable. Hours are the step that makes the
 * rest of it mean anything.
 */
export function OnboardingWizard({ businessName, businessId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);

  const [staffName, setStaffName] = useState("");
  const [createdStaffId, setCreatedStaffId] = useState<string | null>(null);

  const [hours, setHours] = useState(
    BANDS.map((band) => ({ id: band.id, open: band.id !== "sunday", from: band.from, to: band.to }))
  );

  const [slug, setSlug] = useState<string | null>(null);

  function markSeen() {
    try {
      localStorage.setItem(`jiku_onboarding_${businessId}`, "1");
    } catch {
      // Private browsing. The server-side check still redirects once the
      // business is complete, so this is only a shortcut.
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business: { description, phone: phone || undefined } }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      setStep(1);
    } catch (error) {
      toast.error(messageOf(error, "No pudimos guardar los datos"));
    } finally {
      setSaving(false);
    }
  }

  async function saveService() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serviceName, duration, price }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      const created = await res.json();
      setCreatedServiceId(created.id);

      // The professional goes in with the service already assigned: a
      // professional who does nothing cannot be booked either.
      const staffRes = await fetch("/api/panel/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: staffName.trim() || businessName,
          serviceIds: [created.id],
        }),
      });
      if (!staffRes.ok) throw new Error(await errorMessage(staffRes));
      setCreatedStaffId((await staffRes.json()).id);

      setStep(2);
    } catch (error) {
      toast.error(messageOf(error, "No pudimos guardar el servicio"));
    } finally {
      setSaving(false);
    }
  }

  async function saveHours() {
    if (!createdStaffId) return setStep(3);
    setSaving(true);
    try {
      const workingHours = BANDS.flatMap((band) => {
        const state = hours.find((entry) => entry.id === band.id)!;
        return band.days.map((dayOfWeek) => ({
          dayOfWeek,
          startTime: state.from,
          endTime: state.to,
          isActive: state.open,
        }));
      });

      const res = await fetch(`/api/panel/staff/${createdStaffId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workingHours }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));

      const settings = await fetch("/api/panel/settings").then((r) => r.json());
      setSlug(settings?.business?.slug ?? null);
      setStep(3);
    } catch (error) {
      toast.error(messageOf(error, "No pudimos guardar los horarios"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-dots -m-4 min-h-screen px-6 py-8 lg:-m-7 lg:px-11 lg:py-9">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <JikuLogo size="md" />

        <ol className="flex flex-wrap items-center gap-2 text-[11px] text-faint">
          {STEPS.map((entry, index) => (
            <li key={entry.id} className="flex items-center gap-2">
              <span
                className={cn(
                  index === step && "rounded-full border border-jade-link/30 bg-jade-fill px-3 py-1.5 font-bold text-jade-label",
                  index < step && "font-semibold text-jade-label"
                )}
              >
                {index + 1} {entry.label}
              </span>
              {index < STEPS.length - 1 && (
                <span
                  className={cn("h-px w-[22px]", index < step ? "bg-primary" : "bg-border")}
                  aria-hidden
                />
              )}
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={() => {
            markSeen();
            router.push("/panel");
          }}
          className="text-[11px] text-faint hover:text-foreground"
        >
          Saltar por ahora
        </button>
      </header>

      <div className="grid items-center gap-11 lg:grid-cols-[1fr_380px]">
        <div>
          {step === 0 && (
            <Pane
              title={`Contanos de ${businessName}`}
              hint="Esto es lo que van a leer tus clientes cuando abran tu link."
              footer={
                <Continue onClick={saveProfile} saving={saving} step={1} disabled={!description.trim()} />
              }
            >
              <Field label="¿Qué hacen?">
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Barbería clásica con toque moderno. Café mientras esperás."
                  className={field}
                />
              </Field>
              <Field label="Teléfono o WhatsApp">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 223 555 5555"
                  inputMode="tel"
                  className={field}
                />
              </Field>
            </Pane>
          )}

          {step === 1 && (
            <Pane
              title="Tu primer servicio"
              hint="Con uno alcanza para arrancar. Después cargás el resto en dos minutos."
              footer={
                <Continue
                  onClick={saveService}
                  saving={saving}
                  step={2}
                  disabled={!serviceName.trim() || price <= 0}
                />
              }
            >
              <Field label="Servicio">
                <input
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Corte + Barba"
                  className={field}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cuánto dura">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 30)}
                    className={field}
                  />
                </Field>
                <Field label="Cuánto sale">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value) || 0)}
                    className={field}
                  />
                </Field>
              </div>
              <Field label="¿Quién lo hace?">
                <input
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={businessName}
                  className={field}
                />
              </Field>
            </Pane>
          )}

          {step === 2 && (
            <Pane
              title={`¿Cuándo abre ${businessName}?`}
              hint="Tus clientes sólo van a ver horarios dentro de estas franjas. Lo cambiás cuando quieras."
              footer={<Continue onClick={saveHours} saving={saving} step={3} />}
            >
              <div className="flex flex-col gap-[7px]">
                {BANDS.map((band) => {
                  const state = hours.find((entry) => entry.id === band.id)!;
                  return (
                    <div
                      key={band.id}
                      className={cn(
                        "flex flex-wrap items-center gap-3 rounded-[11px] bg-card px-3.5 py-[11px]",
                        state.open ? "border-2 border-primary" : "border border-border opacity-65"
                      )}
                    >
                      <button
                        type="button"
                        role="switch"
                        aria-checked={state.open}
                        aria-label={`Abrir ${band.label}`}
                        onClick={() =>
                          setHours((prev) =>
                            prev.map((entry) =>
                              entry.id === band.id ? { ...entry, open: !entry.open } : entry
                            )
                          )
                        }
                        className={cn(
                          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                          state.open ? "bg-primary" : "bg-border"
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 rounded-full transition-all",
                            state.open ? "right-0.5 bg-white" : "left-0.5 bg-faint"
                          )}
                        />
                      </button>

                      <span className="w-[78px] text-[12.5px] font-semibold">{band.label}</span>

                      {state.open ? (
                        <>
                          <input
                            type="time"
                            aria-label={`${band.label} desde`}
                            value={state.from}
                            onChange={(e) =>
                              setHours((prev) =>
                                prev.map((entry) =>
                                  entry.id === band.id ? { ...entry, from: e.target.value } : entry
                                )
                              )
                            }
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-[11.5px]"
                          />
                          <span className="text-[11px] text-faint">a</span>
                          <input
                            type="time"
                            aria-label={`${band.label} hasta`}
                            value={state.to}
                            onChange={(e) =>
                              setHours((prev) =>
                                prev.map((entry) =>
                                  entry.id === band.id ? { ...entry, to: e.target.value } : entry
                                )
                              )
                            }
                            className="rounded-lg border border-border bg-background px-2.5 py-1.5 font-mono text-[11.5px]"
                          />
                        </>
                      ) : (
                        <span className="text-[11.5px] text-faint">Cerrado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Pane>
          )}

          {step === 3 && (
            <Pane
              title="Listo, tu agenda está abierta"
              hint="Pasá este link por Instagram, por WhatsApp o pegalo en un QR sobre el mostrador."
              footer={
                <button
                  type="button"
                  onClick={() => {
                    markSeen();
                    router.push("/panel");
                  }}
                  className="flex items-center gap-2 rounded-[10px] bg-primary px-7 py-3 text-[13px] font-bold text-primary-foreground shadow-cta transition-colors hover:bg-[#22c55e]"
                >
                  <Check className="size-4" /> Ir a mi panel
                </button>
              }
            >
              {slug && (
                <p className="flex items-center gap-2 rounded-[10px] border border-border bg-card px-3.5 py-3 font-mono text-[13px]">
                  <span className="text-faint">jikuapp.com/</span>
                  <span className="font-semibold">{slug}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://jikuapp.com/${slug}`);
                      toast.success("Link copiado");
                    }}
                    className="ml-auto text-[10px] font-semibold text-jade-link"
                  >
                    Copiar
                  </button>
                </p>
              )}
              {createdServiceId && (
                <p className="text-[12.5px] text-muted-foreground">
                  Cargaste tu primer servicio y tus horarios. Todo lo demás — más servicios, más
                  gente, las señas — lo agregás desde el panel cuando quieras.
                </p>
              )}
            </Pane>
          )}
        </div>

        <div className="hidden text-center lg:block">
          <Image
            src={ILLUSTRATIONS[step]}
            alt=""
            width={340}
            height={260}
            priority
            className="mx-auto w-full max-w-[340px]"
          />
          <p className="mt-3 font-serif text-sm italic text-muted-foreground">
            <span className="text-jade-link">軸</span> Tu agenda empieza a girar en cuanto
            termines.
          </p>
        </div>
      </div>
    </div>
  );
}

const field =
  "w-full rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13px] outline-none transition-colors focus:border-primary";

function Pane({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="mb-1.5 text-[24px] font-extrabold leading-[1.15] tracking-[-0.035em] lg:text-[27px]">
        {title}
      </h1>
      <p className="mb-[22px] text-[12.5px] text-muted-foreground">{hint}</p>
      <div className="flex flex-col gap-3">{children}</div>
      <div className="mt-6 flex flex-wrap items-center gap-3">{footer}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11.5px] font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Continue({
  onClick,
  saving,
  step,
  disabled,
}: {
  onClick: () => void;
  saving: boolean;
  step: number;
  disabled?: boolean;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        disabled={saving || disabled}
        className="flex items-center gap-2 rounded-[10px] bg-primary px-7 py-3 text-[13px] font-bold text-primary-foreground shadow-cta transition-colors hover:bg-[#22c55e] disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
        Continuar
      </button>
      <span className="text-[11px] text-faint">
        Paso {step} de 4 · te quedan ~{4 - step} minutos
      </span>
    </>
  );
}
