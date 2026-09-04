import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * The strip under the hero.
 *
 * It used to be a wall of customer logos — BLADE Studio, NaturalSpa, FitZone,
 * Dr. Wellness, InkMasters — under the words "Confían en Jiku". None of those
 * businesses exist. Inventing customers is the kind of claim that costs
 * everything the first time a real prospect asks to talk to one of them.
 *
 * What replaces it is true and still worth saying: no card, no contract, and
 * the thing runs on the payment processor everybody here already uses.
 */
export function Trust() {
  return (
    <section className="trust">
      <div className="container">
        <div className="trust-inner">
          <span className="trust-label">Sin vueltas</span>
          <div className="trust-logos">
            <span className="trust-logo">{TRIAL_DAYS} días gratis</span>
            <span className="trust-logo">Sin tarjeta</span>
            <span className="trust-logo">Sin permanencia</span>
            <span className="trust-logo">Cobrás con Mercado Pago</span>
            <span className="trust-logo">Hecho en Argentina</span>
          </div>
        </div>
      </div>
    </section>
  );
}
