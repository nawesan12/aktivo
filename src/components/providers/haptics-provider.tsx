"use client";

import { useEffect } from "react";

import { haptic } from "@/lib/haptics";

/**
 * Un golpecito en cada toque, en toda la aplicación.
 *
 * Delegado en el documento y no repartido en cada botón: son cientos de
 * botones, y cualquiera que se agregue mañana quedaría sin él. Acá alcanza con
 * que el toque haya caído dentro de algo que se pueda tocar.
 *
 * Sólo `pointerdown` de un dedo: se dispara en el momento del contacto, que es
 * cuando la vibración se siente como respuesta y no como eco. Con `click`
 * llegaría después de que la pantalla ya cambió.
 *
 * En iPhone no hace nada —iOS no expone la Vibration API, ni siquiera en una
 * aplicación instalada—; en Android sí. Ver `src/lib/haptics.ts`.
 */
const TOCABLE =
  'button, a[href], [role="button"], [role="menuitem"], [role="tab"], [role="switch"], [role="option"], summary, label[for], input[type="checkbox"], input[type="radio"]';

export function HapticsProvider() {
  useEffect(() => {
    function alTocar(event: PointerEvent) {
      // Sólo dedo: un mouse no vibra, y el lápiz tampoco lo espera.
      if (event.pointerType !== "touch") return;

      const destino = event.target as Element | null;
      const tocable = destino?.closest?.(TOCABLE);
      if (!tocable) return;

      // Lo deshabilitado no responde, así que tampoco tiene que sentirse.
      if (tocable.matches(":disabled, [aria-disabled='true']")) return;

      haptic();
    }

    document.addEventListener("pointerdown", alTocar, { passive: true });
    return () => document.removeEventListener("pointerdown", alTocar);
  }, []);

  return null;
}
