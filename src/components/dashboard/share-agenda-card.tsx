"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Check, Copy, ExternalLink, Pencil, Share2 } from "lucide-react";
import { toast } from "@/lib/toast";

/**
 * El link de la agenda, como lo primero que se ve al entrar.
 *
 * Es lo más valioso de la plataforma y lo único que hace entrar turnos: un
 * negocio que no lo reparte no recibe ninguno. Vivía adentro de "Mi web" y en
 * el último paso del alta —o sea, se veía una vez y después había que acordarse
 * dónde estaba— y en la topbar quedaba como un botón blanco entre otros.
 *
 * Acá arriba, en verde y con el link a la vista, porque la pregunta que trae a
 * alguien al panel el primer día es "¿qué le paso a mis clientes?".
 */
export function ShareAgendaCard() {
  const { data } = useSWR("/api/panel/settings", {
    dedupingInterval: 1_800_000,
    revalidateIfStale: false,
  });
  const [copied, setCopied] = useState(false);

  const slug = data?.business?.slug;
  const name = data?.business?.name ?? "mi negocio";
  if (!slug) return null;

  const url = `https://jikuapp.com/${slug}`;

  async function copiar() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado. Pegalo donde quieras.");
    setTimeout(() => setCopied(false), 2000);
  }

  async function compartir() {
    // El menú del sistema: en un teléfono son dos toques hasta WhatsApp, que es
    // como se reparte esto de verdad.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: name, text: `Reservá tu turno en ${name}`, url });
        return;
      } catch {
        // Cancelado por la persona: no es un error que haya que contar.
        return;
      }
    }
    await copiar();
  }

  return (
    <section className="mb-[22px] rounded-2xl border-2 border-primary bg-jade-fill p-5 shadow-[0_16px_40px_-18px_rgba(74,222,128,0.45)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-jade-label">
            Tu link para recibir turnos
          </p>
          <p className="truncate font-mono text-lg font-extrabold tracking-[-0.02em] sm:text-xl">
            jikuapp.com/{slug}
          </p>
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            Pasalo por WhatsApp, ponelo en la bio de tu Instagram o pegalo en un QR sobre el
            mostrador. Es por acá por donde te reservan.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
          <button
            type="button"
            onClick={compartir}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-6 py-3 text-[13px] font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
          >
            <Share2 className="size-4" aria-hidden />
            Compartir mi link
          </button>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-border bg-card px-5 py-3 text-[13px] font-semibold transition-colors hover:border-faint"
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-primary/20 pt-4">
        <Link
          href="/panel/mi-web"
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-4 py-2 text-[12.5px] font-semibold transition-colors hover:border-faint"
        >
          <Pencil className="size-3.5" aria-hidden />
          Editar mi web
        </Link>
        <a
          href={`/${slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-card px-4 py-2 text-[12.5px] font-semibold transition-colors hover:border-faint"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Ver cómo la ven tus clientes
        </a>
      </div>
    </section>
  );
}
