import type { Metadata } from "next";

import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Trust } from "@/components/landing/trust";
import { Features } from "@/components/landing/features";
import { Steps } from "@/components/landing/steps";
import { Philosophy } from "@/components/landing/philosophy";
import { Stats } from "@/components/landing/stats";
import { Pricing } from "@/components/landing/pricing";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Jiku — Tu agenda se mueve sola",
  description:
    "Reservas online 24/7, señas por Mercado Pago y confirmación automática. Para barberías, salones y estética en Argentina.",
};

/**
 * The marketing page.
 *
 * It used to be an island: 1005 lines of hand-written CSS scoped under
 * `.jiku-landing`, with its own palette (`#050507`, violet-leaning greys), its
 * own radii, and font families referenced by string name rather than through the
 * next/font variables. Nothing about it could be reused and nothing that changed
 * in the design tokens reached it. It is the same system as the rest of the app
 * now, and `landing.css` is gone.
 *
 * Everything except the nav is a server component: there is no state on this
 * page, and the scroll-reveal observer that used to hide every section until
 * JavaScript ran took the whole page with it when it did not.
 */
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main id="contenido">
        <Hero />
        <Trust />
        <Features />
        <Steps />
        <Philosophy />
        <Stats />
        <Pricing />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
