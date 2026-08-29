"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a CSS media query.
 *
 * Uses useSyncExternalStore rather than useState + useEffect: matchMedia is an
 * external store, and reading it through an effect meant a synchronous setState
 * on mount (an extra render pass, and a flash of the wrong layout).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onStoreChange);
      return () => media.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    // On the server there is no viewport; false keeps markup deterministic.
    () => false
  );
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 768px)");
}
