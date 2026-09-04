"use client";

import { useState } from "react";
import useSWR from "swr";
import { Bell, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Preference {
  id: string;
  businessId: string;
  emailEnabled: boolean;
  remindersEnabled: boolean;
  business?: { name: string };
}

/**
 * A switch a screen reader can actually announce.
 *
 * It was a `<button>` whose only child was a decorative span: no name, no role,
 * no state. Somebody using a reader heard "botón" and nothing else — on the
 * controls for whether they get emails and reminders at all.
 */
function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-zinc-700"
      } ${disabled ? "opacity-50" : ""}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`} />
    </button>
  );
}

export default function NotificationsPage() {
  const { data: prefs, isLoading, mutate } = useSWR<Preference[]>("/api/account/notification-preferences");
  const [saving, setSaving] = useState<string | null>(null);

  const updatePref = async (businessId: string, field: string, value: boolean) => {
    setSaving(businessId);
    try {
      const existing = prefs?.find((p) => p.businessId === businessId);
      const res = await fetch("/api/account/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          emailEnabled: field === "emailEnabled" ? value : existing?.emailEnabled ?? true,
          remindersEnabled: field === "remindersEnabled" ? value : existing?.remindersEnabled ?? true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Preferencias actualizadas");
      mutate();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Notificaciones</h1>
        <p className="text-muted-foreground text-sm mt-1">Configurá cómo querés recibir notificaciones</p>
      </div>

      {(!prefs || prefs.length === 0) ? (
        <div className="glass rounded-xl p-12 text-center">
          <Bell className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground text-sm">
            Las preferencias se crearán automáticamente cuando reserves un turno
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {prefs.map((pref) => (
            <div key={pref.id} className="glass rounded-xl p-6 space-y-4">
              {pref.business && (
                <h3 className="font-heading font-semibold">{(pref.business as { name: string }).name}</h3>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-info-muted flex items-center justify-center">
                      <Mail className="w-4 h-4 text-info-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-xs text-muted-foreground">Confirmaciones y recordatorios</p>
                    </div>
                  </div>
                  <Toggle
                    label="Recibir emails"
                    checked={pref.emailEnabled}
                    onChange={() => updatePref(pref.businessId, "emailEnabled", !pref.emailEnabled)}
                    disabled={saving === pref.businessId}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-warning-muted flex items-center justify-center">
                      <Bell className="w-4 h-4 text-warning-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Recordatorios</p>
                      <p className="text-xs text-muted-foreground">24h y 1h antes del turno</p>
                    </div>
                  </div>
                  <Toggle
                    label="Recibir recordatorios de turno"
                    checked={pref.remindersEnabled}
                    onChange={() => updatePref(pref.businessId, "remindersEnabled", !pref.remindersEnabled)}
                    disabled={saving === pref.businessId}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
