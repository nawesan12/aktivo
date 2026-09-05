"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Copy, ExternalLink, QrCode, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Link from "next/link";

/**
 * El link de la agenda, a mano desde cualquier pantalla.
 *
 * Es el producto: un negocio que no lo reparte no recibe un solo turno. Vivía
 * dentro de "Mi web" y en el último paso del alta, o sea que se veía una vez y
 * después había que acordarse de dónde estaba. Acá está siempre, al lado de
 * "Cargar un turno", que es la otra cosa que se hace todo el día.
 *
 * Comparte con el menú del sistema donde existe —en un teléfono eso es mandarlo
 * por WhatsApp en dos toques, que es como se reparte de verdad— y copia al
 * portapapeles en una computadora.
 */
export function ShareLinkButton() {
  const { data } = useSWR("/api/panel/settings", {
    // El slug no cambia; pedirlo de nuevo en cada pantalla del panel sería una
    // consulta por navegación para un dato fijo.
    dedupingInterval: 1_800_000,
    revalidateIfStale: false,
  });
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

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
    // El menú del sistema: en un teléfono son dos toques hasta WhatsApp.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: name,
          text: `Reservá tu turno en ${name}`,
          url,
        });
        return;
      } catch {
        // Cancelado por la persona: no es un error que haya que contar.
        return;
      }
    }
    await copiar();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Compartir el link de mi agenda"
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary/40 bg-jade-fill px-3 py-[9px] text-[12.5px] font-bold text-jade-label transition-colors hover:border-primary"
        >
          <Share2 className="size-3.5" aria-hidden />
          <span className="hidden md:inline">Compartir mi agenda</span>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[300px] p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">El link para repartir</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pasalo por WhatsApp, ponelo en tu Instagram o pegalo en un QR sobre el mostrador.
          </p>
        </div>

        <p className="truncate rounded-lg bg-muted/50 px-3 py-2 font-mono text-[11.5px]">
          jikuapp.com/{slug}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={compartir}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-[#22c55e]"
          >
            <Share2 className="size-3.5" aria-hidden />
            Compartir
          </button>
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-accent"
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Copy className="size-3.5" aria-hidden />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3 text-xs">
          <Link
            href="/panel/mi-web"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 text-primary hover:underline"
          >
            <QrCode className="size-3.5" aria-hidden />
            Editar mi web
          </Link>
          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Verla
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
