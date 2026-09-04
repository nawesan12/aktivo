import Link from "next/link";

import { Kanji } from "@/components/brand/kanji";

import { SectionEyebrow } from "./section";

export function Cta() {
  return (
    <section className="relative overflow-hidden border-t border-border-subtle bg-[radial-gradient(700px_340px_at_50%_0%,rgba(74,222,128,0.12),transparent_65%)] px-[22px] py-16 text-center sm:px-10 lg:px-16 lg:py-[88px]">
      <div className="bg-dots absolute inset-0 -z-10" aria-hidden />
      <Kanji size={260} className="hidden sm:block" />

      <div className="relative">
        <SectionEyebrow>Empezá hoy</SectionEyebrow>
        <h2 className="mb-4 text-[34px] font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-[46px]">
          Todo gira alrededor
          <br />
          de un <span className="font-serif italic text-jade-link">eje</span>
        </h2>
        <p className="mx-auto mb-[30px] max-w-[420px] text-[15px] leading-[1.6] text-muted-foreground">
          Poné tus servicios, tus horarios y tu link. Gratis, sin tarjeta, en menos de 3 minutos.
        </p>
        <Link
          href="/registrarse"
          className="inline-block rounded-xl bg-primary px-10 py-4 text-[15px] font-bold text-primary-foreground shadow-[0_12px_32px_-10px_rgba(74,222,128,0.55)] transition-colors hover:bg-[#22c55e]"
        >
          Crear mi cuenta gratis
        </Link>
        <p className="mt-3.5 text-xs text-faint">
          Sin tarjeta · Setup en 3 min · Cancelá cuando quieras
        </p>
      </div>
    </section>
  );
}
