import Link from "next/link";

import { Eyebrow, Kanji } from "@/components/brand/kanji";
import { TRIAL_DAYS } from "@/lib/subscription/access";

import { ProductWindow } from "./product-window";

export function Hero() {
  return (
    <>
      <section className="bg-hero-jade relative overflow-hidden px-[22px] pb-14 pt-16 text-center sm:px-10 lg:px-16 lg:pb-[60px] lg:pt-[84px]">
        <Kanji size={360} className="hidden lg:block" />
        <Kanji size={200} className="lg:hidden" />

        <Eyebrow />

        <h1 className="relative mt-5 text-[42px] font-extrabold leading-[1.02] tracking-[-0.048em] sm:text-[56px] lg:text-[68px]">
          Tu agenda se mueve
          <br />
          {/*
            The one word the whole page is built around, so it is the one word
            set in the serif. Slightly larger than the line it sits on because
            Cormorant's x-height is smaller than Sora's at the same size.
          */}
          <span className="font-serif text-[1.12em] italic text-jade-link">sola.</span>
        </h1>

        <p className="relative mx-auto mb-8 mt-[22px] max-w-[520px] text-[15px] leading-[1.7] text-muted-foreground sm:text-[17px]">
          Reservas online 24/7, señas por Mercado Pago y confirmación automática. Para barberías,
          salones y estética en Argentina.
        </p>

        <div className="relative mb-3.5 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/registrarse"
            className="rounded-xl bg-primary px-[34px] py-[15px] text-[15px] font-bold text-primary-foreground shadow-[0_8px_24px_-8px_rgba(74,222,128,0.5)] transition-colors hover:bg-[#22c55e]"
          >
            Probar {TRIAL_DAYS} días gratis
          </Link>
          {/*
            "Ver demo" in the mockup. There is no demo video, but there is a real
            business page with real availability — which is a better answer to
            the same question.
          */}
          <Link
            href="/explorar"
            className="rounded-xl border border-border bg-card px-[30px] py-[15px] text-[15px] font-semibold transition-colors hover:border-faint"
          >
            Ver una agenda real
          </Link>
        </div>

        <p className="relative text-xs text-faint">
          Sin tarjeta · Setup en 5 minutos · Cancelás cuando quieras
        </p>
      </section>

      <div className="bg-dots px-[22px] pb-[30px] sm:px-10 lg:px-16">
        <ProductWindow />
      </div>
    </>
  );
}
