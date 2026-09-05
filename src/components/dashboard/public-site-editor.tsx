"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
  Palette,
  Images,
  Share2,
  ExternalLink,
  Loader2,
  Trash2,
  Check,
  Copy,
} from "lucide-react";
import { ImageUploader } from "@/components/upload/image-uploader";
import { FormSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { errorMessage, messageOf } from "@/lib/api-message";
import { contrastColor, isHexColor } from "@/lib/utils";

/**
 * Everything the public page of a business looks like, in one place.
 *
 * It used to be the bottom half of "Configuración", between the slot interval
 * and the buffer minutes: two bare hex fields labelled "Color primario" and
 * "Color acentuado", with no way to see what either did until you saved and
 * opened the site. Nobody was going to find it, and if they did they could not
 * tell what they had changed.
 */

/** Palettes that already work: each pair is legible and not garish together. */
const PALETTES: { name: string; primary: string; accent: string }[] = [
  { name: "Barbería clásica", primary: "#C8A24A", accent: "#8B5E34" },
  { name: "Menta", primary: "#4ADE80", accent: "#22D3EE" },
  { name: "Noche", primary: "#6366F1", accent: "#A855F7" },
  { name: "Coral", primary: "#FB7185", accent: "#F59E0B" },
  { name: "Bosque", primary: "#10B981", accent: "#065F46" },
  { name: "Acero", primary: "#38BDF8", accent: "#0F172A" },
];

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface BusinessForm {
  id: string;
  slug: string;
  name: string;
  logo: string;
  coverImage: string;
  about: string;
  description: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  primaryColor: string;
  accentColor: string;
}

const EMPTY: BusinessForm = {
  id: "",
  slug: "",
  name: "",
  logo: "",
  coverImage: "",
  about: "",
  description: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  website: "",
  primaryColor: "",
  accentColor: "",
};

export function PublicSiteEditor() {
  const { data, isLoading, mutate } = useSWR("/api/panel/settings");
  const [form, setForm] = useState<BusinessForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!data?.business) return;
    const b = data.business;
    setForm({
      id: b.id ?? "",
      slug: b.slug ?? "",
      name: b.name ?? "",
      logo: b.logo ?? "",
      coverImage: b.coverImage ?? "",
      about: b.about ?? "",
      description: b.description ?? "",
      instagram: b.instagram ?? "",
      facebook: b.facebook ?? "",
      tiktok: b.tiktok ?? "",
      website: b.website ?? "",
      primaryColor: b.primaryColor ?? "",
      accentColor: b.accentColor ?? "",
    });
  }, [data]);

  function set<K extends keyof BusinessForm>(key: K, value: BusinessForm[K]) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/panel/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business: {
            logo: form.logo,
            coverImage: form.coverImage,
            about: form.about,
            description: form.description,
            instagram: form.instagram,
            facebook: form.facebook,
            tiktok: form.tiktok,
            website: form.website,
            primaryColor: form.primaryColor,
            accentColor: form.accentColor,
          },
        }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      toast.success("Tu web quedó actualizada");
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos guardar los cambios"));
    } finally {
      setSaving(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${form.slug}`);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading) return <FormSkeleton />;

  const primary = isHexColor(form.primaryColor) ? form.primaryColor : "#4ADE80";
  const accent = isHexColor(form.accentColor) ? form.accentColor : "#22D3EE";

  return (
    <div className="space-y-6">
      {/* The link, first: it is what the whole section is for. */}
      <div className="glass rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Tu link para repartir</p>
          <p className="text-sm font-medium truncate">jikuapp.com/{form.slug}</p>
        </div>
        <button
          onClick={copyLink}
          className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1.5 shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
        <Link
          href={`/${form.slug}`}
          target="_blank"
          className="h-9 px-3 rounded-lg border border-border text-sm hover:bg-muted flex items-center gap-1.5 shrink-0"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Ver mi web
        </Link>
      </div>

      {/*
        The other half of the public page.

        This screen is titled "cómo te ven tus clientes", so it is where an
        owner comes looking for anything on it — including the address and the
        map, which live in Configuración. Without this line they simply do not
        find them.
      */}
      <p className="text-xs text-muted-foreground -mt-3">
        La dirección, el teléfono y los horarios que salen en tu web se editan en{" "}
        <Link href="/panel/configuracion" className="text-primary hover:underline">
          Configuración
        </Link>
        .
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Colours */}
        <div className="glass rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold flex items-center gap-2">
            <Palette className="w-4 h-4" /> Colores
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PALETTES.map((palette) => {
              const chosen =
                palette.primary.toLowerCase() === primary.toLowerCase() &&
                palette.accent.toLowerCase() === accent.toLowerCase();
              return (
                <button
                  key={palette.name}
                  onClick={() => {
                    set("primaryColor", palette.primary);
                    set("accentColor", palette.accent);
                  }}
                  className={`rounded-lg border p-2 text-left transition-colors ${
                    chosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                  }`}
                >
                  <span className="flex gap-1 mb-1.5">
                    <span
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ background: palette.primary }}
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-white/10"
                      style={{ background: palette.accent }}
                    />
                  </span>
                  <span className="text-[11px] text-muted-foreground leading-tight block">
                    {palette.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <ColorField
              label="Principal"
              hint="Botones y destacados"
              value={form.primaryColor}
              fallback="#4ADE80"
              onChange={(value) => set("primaryColor", value)}
            />
            <ColorField
              label="Secundario"
              hint="Detalles y degradados"
              value={form.accentColor}
              fallback="#22D3EE"
              onChange={(value) => set("accentColor", value)}
            />
          </div>
        </div>

        {/* What it looks like, without leaving the page. */}
        <div className="glass rounded-xl p-6 space-y-3">
          <h3 className="font-heading font-semibold">Así se va a ver</h3>
          <Preview
            name={form.name}
            logo={form.logo}
            cover={form.coverImage}
            primary={primary}
            accent={accent}
          />
        </div>
      </div>

      {/* Images */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Images className="w-4 h-4" /> Imágenes
        </h3>
        <div className="flex flex-wrap gap-6">
          <div>
            <span className="text-sm font-medium mb-1.5 block">Logo</span>
            <ImageUploader
              value={form.logo || null}
              onChange={(url) => set("logo", url ?? "")}
              kind="logo"
              aspectRatio="1:1"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <span className="text-sm font-medium mb-1.5 block">Portada</span>
            <ImageUploader
              value={form.coverImage || null}
              onChange={(url) => set("coverImage", url ?? "")}
              kind="cover"
              aspectRatio="16:9"
            />
          </div>
        </div>
      </div>

      <Gallery />

      {/* Words */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold">Lo que cuenta tu web</h3>
        <div>
          <label htmlFor="mi-web-descripcion" className="text-sm font-medium mb-1.5 block">
            Una línea que te describa
          </label>
          <input
            id="mi-web-descripcion"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Barbería clásica en el centro"
            className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="mi-web-about" className="text-sm font-medium mb-1.5 block">
            Sobre el local
          </label>
          <textarea
            id="mi-web-about"
            value={form.about}
            onChange={(e) => set("about", e.target.value)}
            rows={4}
            placeholder="Contá quiénes son, desde cuándo, qué los hace distintos."
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {form.about.length}/2000
          </p>
        </div>
      </div>

      {/* Links */}
      <div className="glass rounded-xl p-6 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Share2 className="w-4 h-4" /> Tus redes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            id="mi-web-ig"
            label="Instagram"
            value={form.instagram}
            placeholder="@tunegocio"
            onChange={(value) => set("instagram", value)}
          />
          <TextField
            id="mi-web-fb"
            label="Facebook"
            value={form.facebook}
            placeholder="tunegocio"
            onChange={(value) => set("facebook", value)}
          />
          <TextField
            id="mi-web-tt"
            label="TikTok"
            value={form.tiktok}
            placeholder="@tunegocio"
            onChange={(value) => set("tiktok", value)}
          />
          <TextField
            id="mi-web-web"
            label="Tu sitio"
            value={form.website}
            placeholder="https://..."
            onChange={(value) => set("website", value)}
          />
        </div>
      </div>

      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-6 rounded-lg brand-gradient text-white font-medium text-sm disabled:opacity-50 flex items-center gap-2 shadow-lg"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar cambios
        </button>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium mb-1.5 block">
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function ColorField({
  label,
  hint,
  value,
  fallback,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  fallback: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <span className="text-sm font-medium block">{label}</span>
      <span className="text-xs text-muted-foreground block mb-1.5">{hint}</span>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`Elegir el color ${label.toLowerCase()}`}
          value={isHexColor(value) ? value : fallback}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 shrink-0 rounded-lg border border-border cursor-pointer bg-transparent"
        />
        <input
          aria-label={`Código del color ${label.toLowerCase()}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={fallback}
          className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-muted/50 border border-border text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}

/**
 * A miniature of the public page.
 *
 * The colours are applied the same way the real page applies them — as
 * `--primary` and `--accent` on a wrapper — so what shows here is what the
 * page will do, not an approximation of it.
 */
function Preview({
  name,
  logo,
  cover,
  primary,
  accent,
}: {
  name: string;
  logo: string;
  cover: string;
  primary: string;
  accent: string;
}) {
  const style = {
    "--primary": primary,
    "--accent": accent,
    "--primary-foreground": contrastColor(primary),
  } as React.CSSProperties;

  // `unoptimized` acá y en la galería no es sólo para no pagar una
  // transformación de una imagen que ya subimos en WebP al tamaño que se ve:
  // `next/image` tira si el host no está en `remotePatterns`, y esa excepción
  // sube hasta el error boundary y se lleva puesta la sección entera. Un negocio
  // con una imagen vieja de un host que ya no está en la lista se quedaba sin
  // poder editar su web, ni siquiera para cambiar esa imagen.
  return (
    <div style={style} className="rounded-xl border border-border overflow-hidden bg-background">
      <div
        className="h-20 relative"
        style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
      >
        {cover && (
          <Image src={cover} alt="" fill sizes="400px" unoptimized className="object-cover opacity-60" />
        )}
      </div>
      <div className="p-4 -mt-8 relative">
        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-background bg-muted flex items-center justify-center">
          {logo ? (
            <Image
              src={logo}
              alt=""
              width={56}
              height={56}
              unoptimized
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-lg font-bold" style={{ color: primary }}>
              {(name || "J").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="font-heading font-semibold mt-2 truncate">{name || "Tu negocio"}</p>

        <div className="mt-3 rounded-lg border border-border p-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">Corte de pelo</p>
            <p className="text-xs text-muted-foreground">30 min</p>
          </div>
          <span className="text-sm font-semibold shrink-0" style={{ color: primary }}>
            $10.000
          </span>
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className="w-full h-9 rounded-lg mt-3 text-sm font-medium pointer-events-none"
          style={{ background: primary, color: contrastColor(primary) }}
        >
          Reservar turno
        </button>
      </div>
    </div>
  );
}

function Gallery() {
  const { data, mutate } = useSWR<{ data: Photo[]; max: number }>("/api/panel/mi-web/galeria");
  const [busy, setBusy] = useState(false);

  const photos = data?.data ?? [];
  const max = data?.max ?? 12;

  async function add(url: string | null) {
    if (!url) return;
    setBusy(true);
    try {
      const res = await fetch("/api/panel/mi-web/galeria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos subir la foto"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/panel/mi-web/galeria/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await errorMessage(res));
      mutate();
    } catch (error) {
      toast.error(messageOf(error, "No pudimos borrar la foto"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Images className="w-4 h-4" /> Galería
        </h3>
        <span className="text-xs text-muted-foreground shrink-0">
          {photos.length} / {max}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Fotos del local y de tus trabajos. Es lo que más mira alguien que todavía
        no te conoce.
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
              <Image
                src={photo.url}
                alt={photo.caption ?? ""}
                fill
                sizes="200px"
                unoptimized
                className="object-cover"
              />
              <button
                onClick={() => remove(photo.id)}
                disabled={busy}
                aria-label="Borrar esta foto"
                className="absolute top-1 right-1 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length < max && (
        <div className="max-w-[200px]">
          <ImageUploader
            value={null}
            onChange={add}
            kind="gallery"
            aspectRatio="1:1"
          />
        </div>
      )}
    </div>
  );
}
