"use client";

import { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

/**
 * The cover, as a collage rather than a banner.
 *
 * One big photo and two smaller ones say more about a shop than a single strip
 * of a wall, and the third tile carries the way into the rest of the gallery —
 * which used to be its own section far down the page that most visitors never
 * scrolled to.
 */
export function GalleryCollage({ photos, alt }: { photos: Photo[]; alt: string }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return <div className="brand-gradient m-1.5 h-[168px] rounded-2xl lg:h-[288px]" aria-hidden />;
  }

  const [first, second, third] = photos;

  function show(at: number) {
    setIndex(at);
    setOpen(true);
  }

  return (
    <>
      <div className="flex h-[180px] gap-1.5 p-1.5 lg:h-[300px]">
        <button
          type="button"
          onClick={() => show(0)}
          aria-label="Ver las fotos del local"
          className="relative h-full flex-[2] overflow-hidden rounded-l-2xl rounded-r-md"
        >
          <Image src={first.url} alt={alt} fill sizes="66vw" priority className="object-cover" />
        </button>

        {second && (
          <div className="flex flex-1 flex-col gap-1.5">
            <button
              type="button"
              onClick={() => show(1)}
              aria-label="Ver las fotos del local"
              className="relative h-1/2 overflow-hidden rounded-l-md rounded-r-2xl rounded-b-md"
            >
              <Image src={second.url} alt="" fill sizes="33vw" className="object-cover" />
            </button>
            {third && (
              <button
                type="button"
                onClick={() => show(2)}
                aria-label="Ver las fotos del local"
                className="relative h-1/2 overflow-hidden rounded-b-2xl rounded-t-md"
              >
                <Image src={third.url} alt="" fill sizes="33vw" className="object-cover" />
                {photos.length > 3 && (
                  <span className="absolute bottom-2.5 right-2.5 rounded-full bg-card/95 px-3 py-1.5 text-[10px] font-semibold">
                    Ver las {photos.length} fotos
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fotos del local"
          className="fixed inset-0 z-50 flex flex-col bg-[rgba(9,9,11,0.92)] p-4"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="ml-auto flex size-10 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <X className="size-5" />
          </button>
          <div className="relative flex-1">
            <Image
              src={photos[index].url}
              alt={photos[index].caption ?? ""}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-2">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Foto ${i + 1}`}
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-lg",
                  i === index ? "ring-2 ring-primary" : "opacity-60"
                )}
              >
                <Image src={photo.url} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
