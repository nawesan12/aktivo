import gsap from "gsap";

export const fadeInUp = {
  from: { opacity: 0, y: 40 },
  to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
};

export const fadeInDown = {
  from: { opacity: 0, y: -40 },
  to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
};

export const fadeInLeft = {
  from: { opacity: 0, x: -40 },
  to: { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
};

export const fadeInRight = {
  from: { opacity: 0, x: 40 },
  to: { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
};

export const scaleIn = {
  from: { opacity: 0, scale: 0.9 },
  to: { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" },
};

export function textReveal(element: HTMLElement) {
  const text = element.textContent || "";
  element.textContent = "";

  const chars = text.split("").map((char) => {
    const span = document.createElement("span");
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.display = "inline-block";
    span.style.opacity = "0";
    element.appendChild(span);
    return span;
  });

  return gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration: 0.05,
    stagger: 0.02,
    ease: "power2.out",
  });
}

export function smoothCounter(
  element: HTMLElement,
  endValue: number,
  duration = 2
) {
  const obj = { value: 0 };
  return gsap.to(obj, {
    value: endValue,
    duration,
    ease: "power2.out",
    onUpdate: () => {
      element.textContent = Math.round(obj.value).toLocaleString("es-AR");
    },
  });
}

export function parallax(element: HTMLElement, speed = 0.5) {
  return gsap.to(element, {
    yPercent: -20 * speed,
    ease: "none",
    scrollTrigger: {
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
    },
  });
}
