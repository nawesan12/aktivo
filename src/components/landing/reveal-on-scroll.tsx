"use client";

import { useEffect } from "react";

/**
 * Adds `visible` to every `.jiku-reveal` element as it enters the viewport.
 *
 * Renders nothing: it exists so the rest of the landing can stay server
 * components. The animation is progressive enhancement — without JavaScript the
 * CSS leaves the content visible rather than hiding it forever.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const elements = document.querySelectorAll(".jiku-reveal");

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("visible");
          // Once revealed it stays revealed; watching it further is wasted work.
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
