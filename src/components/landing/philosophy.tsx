import { AxisRing } from "@/components/brand/axis-ring";

import { SectionEyebrow } from "./section";

export function Philosophy() {
  return (
    <section className="relative grid items-center gap-10 overflow-hidden border-t border-border-subtle bg-card px-[22px] py-14 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-16 lg:py-[72px]">
      <div className="flex min-h-[280px] items-center justify-center">
        <AxisRing size={280} seconds={70} />
      </div>

      <div>
        <SectionEyebrow>Filosofía</SectionEyebrow>
        <blockquote className="mb-[18px] font-serif text-[26px] font-semibold italic leading-[1.3] sm:text-[34px]">
          &ldquo;En japonés, 軸 significa <span className="text-jade-link">eje</span> — el centro
          alrededor del cual todo gira.&rdquo;
        </blockquote>
        <p className="max-w-[460px] text-[14.5px] leading-[1.75] text-muted-foreground">
          Tu negocio tiene un eje: tu agenda, tus clientes, tu tiempo. Jiku se convierte en ese
          centro. Sin eje, todo colapsa. Con Jiku, todo fluye.
        </p>
      </div>
    </section>
  );
}
