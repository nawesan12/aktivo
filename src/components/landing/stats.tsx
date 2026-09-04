/**
 * Four figures, every one of them verifiable.
 *
 * "100%" is the one that changed meaning: it used to read "1% de comisión sobre
 * lo que cobrás", and the platform no longer takes a cut — the MercadoPago
 * preference is created without a marketplace_fee, so the whole deposit lands in
 * the business's own account.
 */
const STATS = [
  { value: "24/7", label: "Tu agenda toma turnos" },
  { value: "100%", label: "De lo que cobrás va directo a tu Mercado Pago" },
  { value: "5 min", label: "De la cuenta al primer turno" },
  { value: "$0", label: "Hasta que decidas seguir" },
];

export function Stats() {
  return (
    <div className="bg-dots grid grid-cols-2 border-t border-border-subtle lg:grid-cols-4">
      {STATS.map((stat, index) => (
        <div
          key={stat.value}
          className={[
            "px-5 py-9 text-center lg:py-11",
            index % 2 === 0 ? "border-r border-border-subtle" : "",
            index < 2 ? "border-b border-border-subtle lg:border-b-0" : "",
            index === 2 ? "lg:border-r lg:border-border-subtle" : "",
          ].join(" ")}
        >
          <p className="text-[34px] font-extrabold leading-none tracking-[-0.05em] text-jade-link sm:text-[42px]">
            {stat.value}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
