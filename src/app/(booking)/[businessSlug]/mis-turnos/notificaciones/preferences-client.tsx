"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Bell } from "lucide-react";
import { errorMessage, messageOf } from "@/lib/api-message";

interface Preferences {
  emailEnabled: boolean;
  remindersEnabled: boolean;
}

const DEFAULTS: Preferences = { emailEnabled: true, remindersEnabled: true };

export function GuestNotificationPreferences({
  slug,
  businessName,
}: {
  slug: string;
  businessName: string;
}) {
  const { data, error, isLoading, mutate } = useSWR(`/api/businesses/${slug}/guest-preferences`);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // No row yet means nobody ever changed anything, which is the defaults.
    if (data) setPrefs({ emailEnabled: data.emailEnabled, remindersEnabled: data.remindersEnabled });
  }, [data]);

  async function save(next: Preferences) {
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/guest-preferences`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Preferencias guardadas");
      mutate();
    } catch (err) {
      setPrefs(previous);
      toast.error(messageOf(err, "No pudimos guardar las preferencias"));
    } finally {
      setSaving(false);
    }
  }

  // The API answers off the guest-token cookie, which is set when the person
  // identifies themselves with their phone. Landing here cold is not an error
  // to report, it is a step they have not done yet.
  const needsIdentity = Boolean(error);

  return (
    <div className="space-y-6">
      <Link
        href={`/${slug}/mis-turnos`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis turnos
      </Link>

      <div>
        <h1 className="text-xl font-heading font-bold">Preferencias de notificación</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Qué te manda {businessName} por email.
        </p>
      </div>

      {isLoading ? (
        <div className="glass rounded-xl p-10 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : needsIdentity ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Necesitamos saber quién sos para mostrarte tus preferencias.
          </p>
          <Link
            href={`/${slug}/mis-turnos`}
            className="inline-flex items-center h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
          >
            Identificarme con mi teléfono
          </Link>
        </div>
      ) : (
        <div className="glass rounded-xl divide-y divide-border">
          <PreferenceRow
            icon={<Mail className="w-4 h-4" />}
            title="Confirmaciones por email"
            description="Cuando reservás, cambiás o cancelás un turno."
            checked={prefs.emailEnabled}
            disabled={saving}
            onChange={(value) => save({ ...prefs, emailEnabled: value })}
          />
          <PreferenceRow
            icon={<Bell className="w-4 h-4" />}
            title="Recordatorios"
            description="Un aviso antes del turno para que no se te pase."
            checked={prefs.remindersEnabled}
            disabled={saving}
            onChange={(value) => save({ ...prefs, remindersEnabled: value })}
          />
        </div>
      )}
    </div>
  );
}

function PreferenceRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 p-4">
      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full shrink-0 transition-colors disabled:opacity-50 ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
