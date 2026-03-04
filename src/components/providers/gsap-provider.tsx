"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function GSAPProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Set GSAP defaults for Aktivo aesthetic
    gsap.defaults({
      ease: "power3.out",
      duration: 0.8,
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return <>{children}</>;
}
