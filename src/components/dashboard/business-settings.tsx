"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "@/lib/toast";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";


/**
 * Cómo se comportan las reservas: el intervalo, la anticipación, el colchón
 * entre turnos.
 *
 * Acá había además un formulario con el nombre, la dirección y el contacto del
 * local. Eso es la web pública y se edita en Mi web, junto al resto de lo que ve
 * un cliente; mientras estuvo partido en dos pantallas, la descripción era
 * editable en las dos y guardar en una pisaba la otra.
 */
export function BusinessSettings() {
  const { data, isLoading, mutate } = useSWR("/api/panel/settings");
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    slotInterval: 30,
    minAdvanceHours: 2,
    maxAdvanceDays: 30,
    bufferMinutes: 0,
    allowGuestBooking: true,
  });

  useEffect(() => {
    if (data?.settings) {
      setSettings({
        slotInterval: data.settings.slotInterval || 30,
        minAdvanceHours: data.settings.minAdvanceHours || 2,
        maxAdvanceDays: data.settings.maxAdvanceDays || 30,
        bufferMinutes: data.settings.bufferMinutes || 0,
        allowGuestBooking: data.settings.allowGuestBooking ?? true,
      });
    }
  }, [data]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Sólo los ajustes de reserva. Mandar de vuelta los campos del negocio
        // —que ahora se editan en Mi web— dejaría que una pestaña vieja de esta
        // pantalla deshiciera lo que allá se acaba de guardar.
        body: JSON.stringify({ settings }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Configuración guardada");
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) return <FormSkeleton />;

  return (
    <div className="space-y-6">
      {/* Booking settings */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4" /> Configuración de turnos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="intervalo-de-slots-min" className="text-sm font-medium mb-1.5 block">Intervalo de slots (min)</label>
            <select
              id="intervalo-de-slots-min"
              value={settings.slotInterval}
              onChange={(e) => setSettings((p) => ({ ...p, slotInterval: parseInt(e.target.value) }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div>
            <label htmlFor="anticipacion-minima-hs" className="text-sm font-medium mb-1.5 block">Anticipación mínima (hs)</label>
            <input
              id="anticipacion-minima-hs"
              type="number"
              min={0}
              max={72}
              value={settings.minAdvanceHours}
              onChange={(e) => setSettings((p) => ({ ...p, minAdvanceHours: parseInt(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="dias-de-anticipacion-max" className="text-sm font-medium mb-1.5 block">Días de anticipación max</label>
            <input
              id="dias-de-anticipacion-max"
              type="number"
              min={1}
              max={365}
              value={settings.maxAdvanceDays}
              onChange={(e) => setSettings((p) => ({ ...p, maxAdvanceDays: parseInt(e.target.value) || 30 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="buffer-entre-turnos-min" className="text-sm font-medium mb-1.5 block">Buffer entre turnos (min)</label>
            <input
              id="buffer-entre-turnos-min"
              type="number"
              min={0}
              max={60}
              value={settings.bufferMinutes}
              onChange={(e) => setSettings((p) => ({ ...p, bufferMinutes: parseInt(e.target.value) || 0 }))}
              className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowGuestBooking}
                onChange={(e) => setSettings((p) => ({ ...p, allowGuestBooking: e.target.checked }))}
                className="rounded border-border"
              />
              <span className="text-sm font-medium">Permitir reservas de invitados</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar configuración
        </button>
      </div>
    </div>
  );
}
