"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, X, CalendarPlus } from "lucide-react";
import { errorMessage, messageOf } from "@/lib/api-message";
import { useDebounced } from "@/hooks/use-debounced";

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
 * Booking a turno from behind the counter.
 *
 * Until now there was no way to do it: the panel could only look at
 * appointments the public page had created, so a shop taking a phone call had
 * to open its own website and book as if it were the customer.
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
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const { mutate: globalMutate } = useSWRConfig();

  const { data: servicesData } = useSWR(open ? "/api/panel/services" : null);
  const { data: staffData } = useSWR(open ? "/api/panel/staff" : null);

  const debouncedClient = useDebounced(clientSearch);
  const { data: clientsData } = useSWR(
    open && debouncedClient.length >= 2
      ? `/api/panel/clients?search=${encodeURIComponent(debouncedClient)}&pageSize=5`
      : null
  );

  const { data: slotsData, isLoading: loadingSlots } = useSWR(
    open && serviceId && date
      ? `/api/panel/availability?serviceId=${serviceId}&staffId=${staffId}&date=${date}`
      : null
  );

  const services: Option[] = servicesData?.data ?? [];
  const staff: Option[] = staffData?.data ?? [];
  const clients: ClientOption[] = clientsData?.data ?? [];
  const slots: { time: string }[] = slotsData?.data ?? [];

  const chosenClient = clients.find((client) => client.id === guestClientId);
  const canSave = Boolean(serviceId && time && (guestClientId || name.trim().length >= 2));

  function reset() {
    setServiceId("");
    setStaffId("any");
    setTime("");
    setNotes("");
    setClientSearch("");
    setGuestClientId(null);
    setName("");
    setPhone("");
    setEmail("");
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

      <div className="relative w-full sm:max-w-lg glass rounded-t-2xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold flex items-center gap-2">
            <CalendarPlus className="w-4 h-4" /> Cargar un turno
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Client */}
        <div className="space-y-2">
          <label htmlFor="cliente" className="text-xs text-muted-foreground">
            Cliente
          </label>
          {chosenClient ? (
            <div className="flex items-center justify-between gap-2 h-10 px-3 rounded-lg bg-muted/50 border border-border">
              <span className="text-sm truncate">
                {chosenClient.name || "Sin nombre"}
                {chosenClient.phone && (
                  <span className="text-muted-foreground"> · {chosenClient.phone}</span>
                )}
              </span>
              <button
                onClick={() => setGuestClientId(null)}
                className="text-xs text-primary hover:underline shrink-0"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                id="cliente"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="Buscá un cliente por nombre o teléfono"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {clients.length > 0 && (
                <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setGuestClientId(client.id);
                        setClientSearch("");
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      {client.name || "Sin nombre"}
                      {client.phone && (
                        <span className="text-muted-foreground"> · {client.phone}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-1">O cargalo nuevo:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre"
                  aria-label="Nombre del cliente nuevo"
                  className="h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Teléfono (opcional)"
                  aria-label="Teléfono del cliente nuevo"
                  className="h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (para que le llegue la confirmación)"
                aria-label="Email del cliente nuevo"
                className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </>
          )}
        </div>

        {/* Service and professional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label htmlFor="servicio" className="text-xs text-muted-foreground">
              Servicio
            </label>
            <select
              id="servicio"
              value={serviceId}
              onChange={(e) => {
                setServiceId(e.target.value);
                setTime("");
              }}
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm"
            >
              <option value="">Elegí uno</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="profesional" className="text-xs text-muted-foreground">
              Profesional
            </label>
            <select
              id="profesional"
              value={staffId}
              onChange={(e) => {
                setStaffId(e.target.value);
                setTime("");
              }}
              className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm"
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

        {/* Date and time */}
        <div>
          <label htmlFor="fecha-turno" className="text-xs text-muted-foreground">
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
            className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm"
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Horario</p>
          {!serviceId ? (
            <p className="text-sm text-muted-foreground">Elegí un servicio para ver los horarios.</p>
          ) : loadingSlots ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No queda lugar ese día. Probá con otra fecha o con otro profesional.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => setTime(slot.time)}
                  className={`h-9 px-3 rounded-lg text-sm border transition-colors ${
                    time === slot.time
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/30 border-border hover:bg-muted/50"
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="notas-turno" className="text-xs text-muted-foreground">
            Notas (opcional)
          </label>
          <input
            id="notas-turno"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: viene con su hijo"
            className="w-full h-10 px-3 mt-1 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={save}
          disabled={!canSave || saving}
          className="w-full h-11 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Cargar turno
        </button>
      </div>
    </div>
  );
}
