/**
 * Un golpecito al tocar, donde el dispositivo lo permita.
 *
 * **Ojo con el iPhone: no vibra.** iOS no expone la Vibration API en Safari
 * —tampoco en una aplicación instalada desde la web—, así que en un iPhone esto
 * no hace nada. Funciona en Android (Chrome, Firefox, Samsung Internet), que es
 * donde está la mayoría del mercado argentino. Se implementa igual porque no
 * cuesta nada y suma donde sí existe; para tenerlo en iOS haría falta una
 * aplicación nativa.
 *
 * Los patrones son cortos a propósito. Una vibración larga se siente como un
 * error del teléfono, no como una respuesta al toque.
 */
const PATRONES = {
  /** Tocar algo: navegar, elegir una opción, abrir un panel. */
  toque: 10,
  /** Algo salió bien: se guardó, se cargó el turno, se copió el link. */
  logro: [12, 40, 18],
  /** Algo salió mal, o se está por perder trabajo. */
  error: [30, 60, 30],
} as const;

export type Haptic = keyof typeof PATRONES;

export function haptic(tipo: Haptic = "toque"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;

  try {
    navigator.vibrate(PATRONES[tipo] as number | number[]);
  } catch {
    // Un navegador puede negarse —una pestaña sin interacción previa, por
    // ejemplo— y eso nunca puede romper la acción que el toque disparó.
  }
}
