"use client";

import { useState } from "react";
import useSWR from "swr";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Switch } from "@/components/ui/switch";

/**
 * "Tus turnos de mañana": el único correo que le llega al negocio.
 *
 * Encendido por defecto, porque hasta acá nadie le avisaba nada al dueño: la
 * única notificación que salía por una reserva era la del cliente, y un turno
 * tomado a las once de la noche esperaba a que alguien abriera el panel.
 */
export function DailyDigestSetting() {
  const { data, mutate } = useSWR("/api/panel/settings");
  const [saving, setSaving] = useState(false);

  const enabled = data?.settings?.dailyDigestEnabled ?? true;

  async function toggle(next: boolean) {
    setSaving(true);
    // Optimista: el interruptor tiene que moverse cuando lo tocás, no cuando
    // vuelve la respuesta.
    await mutate({ ...data, settings: { ...data?.settings, dailyDigestEnabled: next } }, false);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { dailyDigestEnabled: next } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast.success(next ? "Te vamos a avisar cada tarde" : "Resumen desactivado");
    } catch (error) {
      await mutate();
      toast.error(error instanceof Error ? error.message : "No pudimos guardarlo");
    } finally {
      setSaving(false);
      await mutate();
    }
  }

  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4" aria-hidden /> Tus turnos de mañana
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-[52ch]">
            Un correo a la tarde con los turnos del día siguiente, para no tener que entrar a
            mirar. Si mañana no hay ninguno, no te llega nada.
          </p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={toggle}
          disabled={saving || !data}
          aria-label="Recibir el resumen de los turnos de mañana"
        />
      </div>
    </div>
  );
}
