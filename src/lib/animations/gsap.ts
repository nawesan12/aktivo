import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * The one place GSAP is configured.
 *
 * There used to be a provider mounted on every route that did this, which meant
 * 160 KB of library downloaded on the landing page, the whole panel and the
 * account pages — none of which animate anything with it. Registration and
 * defaults belong next to the import, so the library only ships to the pages
 * that actually asked for it.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
}

export { gsap, ScrollTrigger };
export default gsap;
