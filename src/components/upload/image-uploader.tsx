"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compressImage, describeSaving, type ImageKind } from "@/lib/image-compress";
import { isBlobUrl, type UploadKind } from "@/lib/uploads";
import { createLogger } from "@/lib/logger";

interface ImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
  kind: UploadKind;
  aspectRatio?: "1:1" | "16:9";
  className?: string;
}

const log = createLogger("ui:image-uploader");

/** What the button is doing, so it can say so instead of always "Comprimiendo…". */
type Phase = "compressing" | "uploading" | null;

/** How hard to squeeze, per use. A logo needs far less room than a cover. */
const BUDGET_FOR: Record<UploadKind, ImageKind> = {
  logo: "logo",
  cover: "cover",
  gallery: "gallery",
  avatar: "avatar",
  service: "gallery",
  staff: "avatar",
};

/**
 * Pick a file, and it is compressed here and put straight into Blob storage.
 *
 * The bytes go from the browser to the store without passing through a
 * function: the only thing our server does is answer whether this business may
 * write this path. And what travels is already WebP, scaled to what the
 * interface actually displays — a logo lands around 30 KB where the original
 * off a phone was three megabytes.
 */
export function ImageUploader({
  value,
  onChange,
  kind,
  aspectRatio = "1:1",
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>(null);
  const busy = phase !== null;
  const isSquare = aspectRatio === "1:1";

  /**
   * Takes the previous file out of the store.
   *
   * Best effort on purpose: if it fails, the person still gets their new image
   * and what is left behind is one orphaned file, not a broken form.
   */
  async function discard(url: string | null) {
    if (!url || !isBlobUrl(url)) return;
    try {
      await fetch("/api/panel/uploads/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Nothing the person can do about it, and nothing they need to know.
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Eso no es una imagen");
      return;
    }

    setPhase("compressing");
    try {
      const compressed = await compressImage(file, BUDGET_FOR[kind]);

      setPhase("uploading");

      // One same-origin POST carrying the file. Where it lands is the route's
      // call, derived from the session — the browser does not get to name the
      // path, which is one less thing to check on the way in.
      const form = new FormData();
      form.append("file", compressed.file);
      form.append("kind", kind);

      const response = await fetch("/api/panel/uploads", { method: "POST", body: form });
      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!response.ok || !payload?.url) {
        // The route refuses with a plain message — plan, permission, format or
        // size — and that message is the useful part.
        throw new Error(payload?.error || `No pudimos subir la imagen (${response.status})`);
      }

      const blob = { url: payload.url };

      const previous = value;
      onChange(blob.url);
      toast.success(`Imagen subida · ${describeSaving(compressed)}`);

      // Only after the new one is in place: deleting first would leave the form
      // with a dead URL if the upload then failed.
      void discard(previous);
    } catch (error) {
      // Shown as it comes: every message on this path already says what went
      // wrong and, where it matters, what to do about it. A generic "no pudimos
      // subir la imagen" here would throw away the only useful thing we have.
      const message = error instanceof Error ? error.message : "No pudimos subir la imagen";
      log.warn("upload failed", { kind, reason: message });
      toast.error(message);
    } finally {
      setPhase(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      className={cn(
        "relative group rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors overflow-hidden bg-muted/20",
        isSquare ? "w-32 h-32" : "w-full h-40",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Elegir una imagen"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <>
          <Image
            src={value}
            alt=""
            fill
            sizes={isSquare ? "128px" : "400px"}
            // Already WebP at the size it is shown: running it through the
            // image optimiser again would bill a transformation to produce the
            // file we just uploaded.
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              aria-label="Cambiar la imagen"
              className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => {
                const previous = value;
                onChange(null);
                void discard(previous);
              }}
              disabled={busy}
              aria-label="Quitar la imagen"
              className="w-9 h-9 rounded-lg bg-white/15 text-white flex items-center justify-center disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {busy ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-[11px]">
                {phase === "compressing" ? "Comprimiendo…" : "Subiendo…"}
              </span>
            </>
          ) : (
            <>
              <ImageIcon className="w-5 h-5 opacity-60" />
              <span className="text-[11px] px-2 text-center leading-tight">Subir imagen</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
