import { TRIAL_DAYS } from "@/lib/subscription/access";

const CLAIMS = [
  `${TRIAL_DAYS} días gratis`,
  "Sin tarjeta",
  "Sin permanencia",
  "Cobrás con Mercado Pago",
  "Hecho en Argentina",
];

export function Trust() {
  return (
    <div className="bg-dots flex flex-wrap items-center justify-center gap-x-[26px] gap-y-3 px-[22px] pb-14 pt-[26px] text-[12.5px] text-muted-foreground sm:px-10 lg:px-16 lg:pb-[60px]">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-faint">
        Sin vueltas
      </span>
      {CLAIMS.map((claim, index) => (
        <span key={claim} className="flex items-center gap-x-[26px]">
          {index > 0 && <span className="size-1 rounded-full bg-primary" aria-hidden />}
          {claim}
        </span>
      ))}
    </div>
  );
}
