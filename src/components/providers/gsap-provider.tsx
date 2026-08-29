"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Sets GSAP's global defaults, once, on the client.
 *
 * The import is dynamic so that GSAP and ScrollTrigger are not pulled into the
 * bundle of every page that happens to sit under a layout using this provider.
 * The panel, for instance, renders no GSAP animation at all — it was shipping
 * the library anyway. The pages that do animate import GSAP themselves, and the
 * module is cached after the first load.
 */
export function GSAPProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);
      gsap.defaults({ ease: "power3.out", duration: 0.8 });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}
