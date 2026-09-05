"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Loader2, X, CalendarPlus, Check, UserPlus, Search } from "lucide-react";
import { errorMessage, messageOf } from "@/lib/api-message";
import { useDebounced } from "@/hooks/use-debounced";
import { formatPhoneForDisplay } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface Option {
  id: string;
  name: string;
}

interface ClientOption {
  id: string;
  name: string | null;
  phone: string | null;
  type: "registered" | "guest";
}

/**
 * Listas que casi nunca cambian.
 *
 * Los servicios y el personal de un negocio se tocan una vez por mes, y este
 * modal se abre muchas veces por día: sin esto, cada apertura los vuelve a
 * pedir. Media hora de caché y sin revalidar por estar viejos deja una consulta
 * por pestaña en vez de una por apertura.
 */
const CASI_ESTATICO = { dedupingInterval: 1_800_000, revalidateIfStale: false } as const;

const campo =
  "w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary";

/**
 * Cargar un turno desde el mostrador.
 *
 * Reordenado: primero qué y cuándo, después quién.
 *
 * Antes empezaba por el cliente —con un buscador y tres campos de alta abiertos
 * al mismo tiempo, sin que quedara claro si había que buscar o cargar— y recién
 * abajo preguntaba el servicio, del que dependen los horarios. Así, el dueño
 * llenaba los datos de la persona que tenía enfrente antes de saber si quedaba
 * lugar. Con el cliente esperando del otro lado del mostrador, el orden es el
 * de la conversación real: "¿te sirve el martes a las tres?" y después el
 * nombre.
 *
 * Cada paso aparece cuando el anterior está resuelto: menos que leer de una, y
 * ninguna consulta que se dispare por algo que todavía no se eligió.
 */
export function NewAppointmentDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("any");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const [clientSearch, setClientSearch] = useState("");
  const [guestClientId, setGuestClientId] = useState<string | null>(null);
  const [chosenLabel, setChosenLabel] = useState("");
  /** El alta de un cliente nuevo, sólo cuando se pide. */
  const [creatingClient, setCreatingClient] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  const { data: servicesData } = useSWR(
    open ? "/api/panel/services" : null,
    CASI_ESTATICO
  );
  // Sólo cuando ya hay servicio: hasta entonces el selector no se muestra, así
  // que pedirlo al abrir era una consulta para una lista que nadie iba a ver.
  const { data: staffData } = useSWR(
    open && serviceId ? "/api/panel/staff" : null,
    CASI_ESTATICO
  );

  const debouncedClient = useDebounced(clientSearch);
  // Tres letras, no dos: con dos, "ma" trae medio padrón y es una consulta por
  // cada nombre que empieza igual.
  const buscando = debouncedClient.trim().length >= 3;
  const { data: clientsData, isLoading: loadingClients } = useSWR(
    open && buscando && !guestClientId
      ? `/api/panel/clients?search=${encodeURIComponent(debouncedClient.trim())}&pageSize=5`
      : null
  );

  const { data: slotsData, isLoading: loadingSlots } = useSWR(
    open && serviceId && date
      ? `/api/panel/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`
      : null,
    // Los horarios del día anterior siguen en pantalla mientras llegan los
    // nuevos: sin esto la grilla desaparece y vuelve en cada cambio de fecha.
    { keepPreviousData: true }
  );

  const services: Option[] = servicesData?.data ?? [];
  const staff: Option[] = staffData?.data ?? [];
  const clients: ClientOption[] = clientsData?.data ?? [];
  const slots: { time: string }[] = slotsData?.data ?? [];

  const clienteListo = Boolean(guestClientId || (creatingClient && name.trim().length >= 2));
  const canSave = Boolean(serviceId && time && clienteListo);

  function reset() {
    setServiceId("");
    setStaffId("any");
    setTime("");
    setNotes("");
    setClientSearch("");
    setGuestClientId(null);
    setChosenLabel("");
    setCreatingClient(false);
    setName("");
    setPhone("");
    setEmail("");
  }

  function elegirCliente(client: ClientOption) {
    setGuestClientId(client.id);
    setChosenLabel(
      [client.name || "Sin nombre", client.phone ? formatPhoneForDisplay(client.phone) : null]
        .filter(Boolean)
        .join(" · ")
    );
    setClientSearch("");
    setCreatingClient(false);
  }

  function empezarClienteNuevo() {
    // Lo que ya escribió en el buscador es, casi siempre, el nombre.
    setName(clientSearch.trim());
    setCreatingClient(true);
    setGuestClientId(null);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId,
          date,
          time,
          notes: notes || undefined,
          ...(guestClientId
            ? { guestClientId }
            : { name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined }),
        }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      const created = await res.json();

      // The client's name comes back from the server, not from the form: a
      // phone that already belongs to a client attaches the turno to them and
      // keeps their existing name, and the owner has to see which person it
      // actually landed on. And whether anything was emailed is said plainly —
      // a walk-in entered without an address gets nothing, and it is the owner
      // who then has to remember to remind them.
      const base = `Turno cargado para ${created.clientName} con ${created.staffName}.`;
      const abono = created.usedMembership
        ? ` Va con su abono: le quedan ${created.membershipRemaining}.`
        : "";
      const aviso = created.notified
        ? " Le mandamos la confirmación."
        : " Sin email, no le llega confirmación.";
      toast.success(base + abono + aviso);
      // The slot this turno just took is still in SWR's cache, and an owner
      // booking two clients in a row reopens this within seconds — they would
      // be offered the time they just filled, and the insert would come back
      // 409. Dropping every availability entry is cheaper than reasoning about
      // which one changed.
      await globalMutate(
        (key) => typeof key === "string" && key.startsWith("/api/panel/availability"),
        undefined,
        { revalidate: true }
      );

      reset();
      onCreated();
      onClose();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos cargar el turno"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Cargar un turno"
    >
      <button aria-label="Cerrar" className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg glass rounded-t-2xl sm:rounded-2xl p-5 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" aria-hidden /> Cargar un turno
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" aria-hidden />
          </button>
        </div>

        {/* 1 — Qué */}
        <section className="space-y-2">
          <Paso numero={1} titulo="¿Qué se hace?" />
          <div className="flex flex-wrap gap-2">
            {services.map((service) => (
              <button
                key={service.id}
                type="button"
                aria-pressed={serviceId === service.id}
                onClick={() => {
                  setServiceId(service.id);
                  setTime("");
                }}
                className={cn(
                  "h-9 px-3 rounded-lg text-sm border transition-colors",
                  serviceId === service.id
                    ? "bg-primary text-primary-foreground border-primary font-medium"
                    : "bg-muted/30 border-border hover:bg-muted/50"
                )}
              >
                {service.name}
              </button>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground">Cargá un servicio primero.</p>
            )}
          </div>
        </section>

        {/* 2 — Cuándo */}
        {serviceId && (
          <section className="space-y-2">
            <Paso numero={2} titulo="¿Cuándo?" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="fecha-turno" className="sr-only">
                  Fecha
                </label>
                <input
                  id="fecha-turno"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setTime("");
                  }}
                  className={campo}
                />
              </div>
              <div>
                <label htmlFor="profesional" className="sr-only">
                  Profesional
                </label>
                <select
                  id="profesional"
                  value={staffId}
                  onChange={(e) => {
                    setStaffId(e.target.value);
                    setTime("");
                  }}
                  className={campo}
                >
                  <option value="any">Quien esté libre</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loadingSlots && slots.length === 0 ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" aria-label="Buscando horarios" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No queda lugar ese día. Probá con otra fecha o con otro profesional.
              </p>
            ) : (
              <div className={cn("flex flex-wrap gap-2", loadingSlots && "opacity-50")}>
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    aria-pressed={time === slot.time}
                    onClick={() => setTime(slot.time)}
                    className={cn(
                      "h-9 px-3 rounded-lg text-sm border transition-colors",
                      time === slot.time
                        ? "bg-primary text-primary-foreground border-primary font-medium"
                        : "bg-muted/30 border-border hover:bg-muted/50"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 3 — Quién */}
        {time && (
          <section className="space-y-2">
            <Paso numero={3} titulo="¿Para quién?" />

            {guestClientId ? (
              <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-lg bg-jade-fill border border-primary/30">
                <span className="text-sm truncate flex items-center gap-2">
                  <Check className="size-3.5 shrink-0 text-jade-label" aria-hidden />
                  {chosenLabel}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGuestClientId(null);
                    setChosenLabel("");
                  }}
                  className="text-xs text-primary hover:underline shrink-0"
                >
                  Cambiar
                </button>
              </div>
            ) : creatingClient ? (
              <div className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del cliente nuevo"
                  autoFocus
                  className={campo}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Teléfono"
                    inputMode="tel"
                    aria-label="Teléfono del cliente nuevo"
                    className={campo}
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    aria-label="Email del cliente nuevo"
                    className={campo}
                  />
                </div>
                <p className="text-[11px] text-faint">
                  Sin email no le llega la confirmación: se la tenés que recordar vos.
                </p>
                <button
                  type="button"
                  onClick={() => setCreatingClient(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Buscar uno que ya existe
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    aria-hidden
                  />
                  <input
                    id="cliente"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscá por nombre o teléfono"
                    aria-label="Buscar un cliente"
                    autoFocus
                    className={cn(campo, "pl-9")}
                  />
                </div>

                {loadingClients && (
                  <p className="text-xs text-muted-foreground">Buscando…</p>
                )}

                {clients.length > 0 && (
                  <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => elegirCliente(client)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                      >
                        {client.name || "Sin nombre"}
                        {client.phone && (
                          <span className="text-muted-foreground">
                            {" · "}
                            {formatPhoneForDisplay(client.phone)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/*
                  El alta aparece acá, y no como tres campos siempre abiertos
                  debajo del buscador: así el modal pregunta una cosa a la vez y
                  no queda la duda de si hay que buscar o cargar.
                */}
                {buscando && !loadingClients && clients.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Ninguno con ese dato.
                  </p>
                )}
                <button
                  type="button"
                  onClick={empezarClienteNuevo}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <UserPlus className="size-3.5" aria-hidden />
                  {clientSearch.trim() ? `Cargar a "${clientSearch.trim()}" como nuevo` : "Es un cliente nuevo"}
                </button>
              </div>
            )}

            <label htmlFor="notas-turno" className="sr-only">
              Notas
            </label>
            <input
              id="notas-turno"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional). Ej: viene con su hijo"
              className={campo}
            />
          </section>
        )}

        {/* El resumen, para no tener que subir a revisar qué quedó elegido. */}
        {time && (
          <p className="text-xs text-muted-foreground">
            {services.find((s) => s.id === serviceId)?.name} ·{" "}
            {format(new Date(`${date}T00:00:00`), "EEEE d 'de' MMMM", { locale: es })} · {time}
          </p>
        )}

        <button
          onClick={save}
          disabled={!canSave || saving}
          className="w-full h-11 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
          Cargar turno
        </button>
      </div>
    </div>
  );
}

function Paso({ numero, titulo }: { numero: number; titulo: string }) {
  return (
    <h3 className="text-sm font-bold">
      <span className="font-mono text-jade-link">{numero}</span> · {titulo}
    </h3>
  );
}
