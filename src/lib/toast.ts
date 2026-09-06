import { toast as sonner } from "sonner";

import { haptic } from "@/lib/haptics";

/**
 * Los avisos del producto, con un golpecito.
 *
 * Envuelve a sonner en vez de llamar a `haptic()` en cada sitio: los toasts son
 * el lugar donde la aplicación ya dice "salió bien" o "salió mal", así que
 * engancharse acá cubre las cien acciones de una sola vez y no se puede olvidar
 * en la que se agregue mañana.
 *
 * En iPhone no vibra —iOS no expone la Vibration API—, así que esto sólo suma
 * en Android. Ver `src/lib/haptics.ts`.
 */
type Sonner = typeof sonner;

export const toast: Sonner = new Proxy(sonner, {
  apply(target, thisArg, args: Parameters<Sonner>) {
    haptic();
    return Reflect.apply(target, thisArg, args);
  },
  get(target, prop, receiver) {
    const valor = Reflect.get(target, prop, receiver);
    if (typeof valor !== "function") return valor;

    if (prop === "success") {
      return (...args: unknown[]) => {
        haptic("logro");
        return (valor as (...a: unknown[]) => unknown).apply(target, args);
      };
    }
    if (prop === "error" || prop === "warning") {
      return (...args: unknown[]) => {
        haptic("error");
        return (valor as (...a: unknown[]) => unknown).apply(target, args);
      };
    }
    return valor.bind(target);
  },
});
