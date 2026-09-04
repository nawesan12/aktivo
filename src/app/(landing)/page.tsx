import "./landing.css";

import { Nav } from "@/components/landing/nav";
import { RevealOnScroll } from "@/components/landing/reveal-on-scroll";
import { Hero } from "@/components/landing/hero";
import { Trust } from "@/components/landing/trust";
import { Philosophy } from "@/components/landing/philosophy";
import { Features } from "@/components/landing/features";
import { Stats } from "@/components/landing/stats";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

/**
 * The page that converts.
 *
 * It used to be a single 1685-line client component: every word of copy, and
 * 964 lines of CSS in a template literal, shipped as JavaScript and rendered in
 * the browser. Now only the navigation and the scroll-reveal effect are client
 * components; everything else is HTML from the server, which is what a crawler
 * — and a phone on mobile data — actually receives.
 */
export default function LandingPage() {
  return (
    <div className="jiku-landing">
      <RevealOnScroll />
      <Nav />
      <main id="contenido">
        <Hero />
        <Trust />
        <Philosophy />
        <Features />
        <Stats />
        <Pricing />
        <Testimonials />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
