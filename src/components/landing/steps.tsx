import Image from "next/image";

import { Section, SectionEyebrow, SectionTitle } from "./section";

const STEPS = [
  {
    photo: "/fotos/unas.webp",
    title: "Cargá lo tuyo",
    body: "Tus servicios, tu equipo y los horarios en que abrís. Cinco minutos, una sola vez.",
  },
  {
    photo: "/fotos/salon.webp",
    title: "Pasá tu link",
    body: "En tu Instagram, en el WhatsApp del local o en un QR sobre el mostrador. Reservan solos, también a las 2 AM.",
  },
  {
    photo: "/fotos/corte.webp",
    title: "Ocupate de atender",
    body: "Jiku confirma apenas reservan, con día, hora y con quién. Si querés, cobra la seña en el mismo paso.",
  },
];

export function Steps() {
  return (
    <Section id="como-funciona" className="py-14 lg:py-[72px]">
      <div className="mb-11 text-center">
        <SectionEyebrow>Cómo funciona</SectionEyebrow>
        <SectionTitle>
          Tres pasos y tu agenda
          <br />
          empieza a llenarse sola
        </SectionTitle>
      </div>

      <ol className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
          >
            <div className="relative h-[140px]">
              <Image
                src={step.photo}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="p-[22px]">
              <p className="mb-2 font-mono text-[10.5px] text-jade-link">
                PASO {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mb-1.5 text-[15px] font-bold">{step.title}</h3>
              <p className="text-[13px] leading-[1.65] text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
