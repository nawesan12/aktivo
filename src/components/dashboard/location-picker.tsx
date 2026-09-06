"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, Crosshair } from "lucide-react";
import { toast } from "@/lib/toast";

import "leaflet/dist/leaflet.css";

/** Mar del Plata, si no hay nada más de dónde partir. */
const CENTRO_POR_DEFECTO: [number, number] = [-38.0055, -57.5426];

export interface Punto {
  lat: number;
  lng: number;
}

/**
 * El punto exacto del local, puesto a mano.
 *
 * Antes el pin lo ponía Google interpretando el texto de la dirección, y no
 * había forma de corregirlo: en un barrio con numeración irregular, o en un
 * local sobre una esquina, caía a media cuadra y el cliente tocaba timbre en
 * otra puerta. Acá se toca el mapa y queda donde está la puerta.
 *
 * Leaflet sobre OpenStreetMap: sin clave de API, sin cuota y sin una sola
 * llamada a nuestro servidor — los tiles los pide el navegador del dueño, y
 * sólo mientras esta pantalla está abierta.
 */
export function LocationPicker({
  value,
  address,
  onChange,
}: {
  value: Punto | null;
  /** Para centrar el mapa la primera vez, cuando todavía no hay punto. */
  address: string;
  onChange: (punto: Punto) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<import("leaflet").Map | null>(null);
  const marcador = useRef<import("leaflet").Marker | null>(null);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    let cancelado = false;

    // Cargado acá y no arriba: Leaflet toca `window` al importarse, y son 40 KB
    // que sólo hacen falta en esta pantalla.
    import("leaflet").then((L) => {
      if (cancelado || !contenedor.current || mapa.current) return;

      const inicial: [number, number] = value ? [value.lat, value.lng] : CENTRO_POR_DEFECTO;
      const instancia = L.map(contenedor.current).setView(inicial, value ? 17 : 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(instancia);

      // El ícono por defecto de Leaflet apunta a imágenes que el bundler no
      // resuelve; uno propio evita el 404 y además combina con el resto.
      const icono = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#4ade80;border:2px solid #0a0a0a;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 22],
      });

      const pin = L.marker(inicial, { draggable: true, icon: icono }).addTo(instancia);

      pin.on("dragend", () => {
        const { lat, lng } = pin.getLatLng();
        onChange({ lat, lng });
      });
      instancia.on("click", (event: import("leaflet").LeafletMouseEvent) => {
        pin.setLatLng(event.latlng);
        onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
      });

      mapa.current = instancia;
      marcador.current = pin;
    });

    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
      marcador.current = null;
    };
    // Sólo al montar: mover el mapa cuando cambia `value` pelearía con la mano
    // que lo está arrastrando.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Lleva el mapa a la dirección escrita, para no arrastrarlo desde cero. */
  async function buscarLaDireccion() {
    if (!address.trim()) {
      toast.error("Escribí la dirección primero.");
      return;
    }
    setBuscando(true);
    try {
      // Nominatim es el geocodificador de OpenStreetMap: gratis y sin clave.
      // Se usa sólo cuando el dueño lo pide, que es lo que su política admite.
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ar&q=${encodeURIComponent(address)}`
      );
      const [encontrado] = (await res.json()) as { lat: string; lon: string }[];
      if (!encontrado) {
        toast.error("No la encontramos. Movés el pin a mano y listo.");
        return;
      }
      const punto = { lat: Number(encontrado.lat), lng: Number(encontrado.lon) };
      mapa.current?.setView([punto.lat, punto.lng], 17);
      marcador.current?.setLatLng([punto.lat, punto.lng]);
      onChange(punto);
    } catch {
      toast.error("No pudimos buscarla. Movés el pin a mano y listo.");
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Tocá el mapa o arrastrá el pin hasta la puerta de tu local.
        </p>
        <button
          type="button"
          onClick={buscarLaDireccion}
          disabled={buscando}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
        >
          {buscando ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />
          ) : (
            <Crosshair className="w-3.5 h-3.5" aria-hidden />
          )}
          Buscar mi dirección
        </button>
      </div>

      <div
        ref={contenedor}
        role="application"
        aria-label="Mapa para marcar dónde está el local"
        className="h-[260px] w-full overflow-hidden rounded-lg border border-border bg-muted/30"
      />

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <MapPin className="w-3 h-3 shrink-0" aria-hidden />
        {value
          ? `Marcado en ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}.`
          : "Todavía sin marcar: el mapa de tu web lo va a ubicar por la dirección escrita."}
      </p>
    </div>
  );
}
