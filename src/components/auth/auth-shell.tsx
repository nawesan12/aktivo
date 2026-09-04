import Image from "next/image";
import Link from "next/link";

import { Eyebrow } from "@/components/brand/kanji";
import { JikuLogo } from "@/components/brand/jiku-logo";

/**
 * Half a photograph, half a form.
 *
 * Every auth screen used to be a 448px card floating in the middle of an empty
 * page, which is what a login looks like when nobody has designed it. The left
 * half now does the job the landing does — says what this is and why you would
 * want it — and the form gets the whole right half instead of a column.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Image
          src="/fotos/barberia-interior.webp"
          alt=""
          fill
          sizes="50vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,15,9,0.78),rgba(5,15,9,0.08)_55%)]" />

        <Link href="/" className="absolute left-8 top-7 text-white">
          <JikuLogo size="md" />
        </Link>

        <div className="absolute inset-x-8 bottom-8 text-white">
          <p className="text-[26px] font-bold leading-tight tracking-[-0.03em]">
            Tu agenda se mueve sola.
          </p>
          <p className="mt-2 max-w-[380px] text-[13px] leading-[1.6] opacity-85">
            Mientras vos atendés, Jiku toma reservas, cobra señas y confirma turnos.
          </p>
          <p className="mt-[18px] flex gap-[18px] text-xs opacity-90">
            <span>Reservas 24/7</span>
            <span aria-hidden>·</span>
            <span>Mercado Pago</span>
            <span aria-hidden>·</span>
            <span>Hecho en Argentina</span>
          </p>
        </div>
      </div>

      <div className="bg-dots relative flex flex-col justify-center px-6 py-14 sm:px-16">
        <span
          className="pointer-events-none absolute bottom-6 right-8 select-none font-serif text-[64px] leading-none text-primary/[0.16]"
          aria-hidden
        >
          軸
        </span>

        <div className="relative mx-auto w-full max-w-[360px]">
          <Link href="/" className="mb-5 inline-flex lg:hidden">
            <JikuLogo size="md" withKanji />
          </Link>

          <Eyebrow rules={false} className="mb-3.5 text-xs tracking-[0.2em]">
            <span className="mr-2.5 inline-block h-px w-[26px] bg-jade-link align-middle" aria-hidden />
            軸 · EL EJE DE TU NEGOCIO
          </Eyebrow>

          <h1 className="mb-1.5 text-[26px] font-bold tracking-[-0.03em]">{title}</h1>
          <p className="mb-8 text-[13.5px] text-muted-foreground">{subtitle}</p>

          {children}

          {footer && <div className="mt-[26px] text-center text-[12.5px] text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

/** The field shape every auth form uses. */
export const authField =
  "w-full rounded-[10px] border border-border bg-card px-[15px] py-[13px] text-[13.5px] outline-none transition-colors focus:border-primary";

export const authLabel = "mb-[7px] block text-[12.5px] font-semibold";
