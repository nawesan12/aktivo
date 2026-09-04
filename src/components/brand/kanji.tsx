import { cn } from "@/lib/utils";

/**
 * 軸 — "axis". The character the product is named after, used two ways.
 *
 * `Kanji` is the watermark: a very large, very faint glyph centred behind a hero
 * or a closing CTA. It is decorative, so it is hidden from assistive technology
 * and cannot be selected or clicked through.
 */
export function Kanji({
  size = 340,
  className,
  opacity = 0.08,
}: {
  size?: number;
  className?: string;
  opacity?: number;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[56%] select-none font-serif leading-none",
        className
      )}
      style={{ fontSize: size, color: `rgba(74, 222, 128, ${opacity})` }}
    >
      軸
    </span>
  );
}

/**
 * The eyebrow above a section title: a hairline, the kanji, the claim in small
 * caps, another hairline. Cormorant Garamond at 13px with wide tracking.
 */
export function Eyebrow({
  children = "軸 · EL EJE DE TU NEGOCIO",
  rules = true,
  className,
}: {
  children?: React.ReactNode;
  /** The hairlines either side. Off when the eyebrow is left-aligned. */
  rules?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative inline-flex max-w-full flex-wrap items-center justify-center gap-2.5 font-serif text-[13px] font-semibold tracking-[0.22em] text-jade-link",
        className
      )}
    >
      {rules && <span className="h-px w-[30px] bg-jade-link" aria-hidden />}
      {children}
      {rules && <span className="h-px w-[30px] bg-jade-link" aria-hidden />}
    </div>
  );
}
