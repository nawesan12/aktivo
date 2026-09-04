"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { errorMessage } from "@/lib/api-message";

/**
 * "Avisame cuando haya lugar."
 *
 * The previous version swallowed every failure — the fetch had an empty
 * `catch {}` and the success screen showed regardless, so a customer who left
 * their number on a bad connection was told they were on a list that never
 * received them.
 */
export function WaitlistForm({
  slug,
  serviceId,
  staffId,
  preferredDate,
  onDone,
}: {
  slug: string;
  serviceId: string;
  staffId: string | null;
  preferredDate: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/businesses/${slug}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          staffId: staffId || undefined,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          preferredDate,
        }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      setDone(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos anotarte. Probá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mt-3.5 rounded-xl border border-jade-link/30 bg-card p-4 text-center text-[12.5px] text-jade-label">
        Listo, te avisamos apenas se libere un horario.
        <button
          type="button"
          onClick={onDone}
          className="ml-2 font-semibold underline underline-offset-2"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3.5 rounded-xl border border-border bg-card p-4">
      <p className="mb-3 text-[12.5px] font-semibold">Dejanos tus datos y te avisamos</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          required
          className="h-10 rounded-[10px] border border-border bg-background px-3 text-[12.5px] outline-none focus:border-primary"
          placeholder="Tu nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Tu nombre"
        />
        <input
          required
          className="h-10 rounded-[10px] border border-border bg-background px-3 text-[12.5px] outline-none focus:border-primary"
          placeholder="Tu teléfono"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          aria-label="Tu teléfono"
        />
        <input
          className="h-10 rounded-[10px] border border-border bg-background px-3 text-[12.5px] outline-none focus:border-primary"
          placeholder="Tu email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Tu email"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-[10px] bg-primary px-5 py-2.5 text-[12.5px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e] disabled:opacity-50"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          Anotarme
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-[10px] border border-border px-4 py-2.5 text-[12.5px] text-muted-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
