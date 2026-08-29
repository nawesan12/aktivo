import Link from "next/link";

/**
 * Closing call to action.
 */
export function Cta() {
  return (
    <section className="cta">
      <div className="cta-axis" />
      <div className="cta-glow" />
      <div className="container">
        <div className="cta-content jiku-reveal">
          <div className="section-eyebrow">Empezá hoy</div>
          <h2>
            Todo gira alrededor
            <br />
            de un <em className="serif jade">eje</em>
          </h2>
          <p>
            Unite a los 12,400+ negocios que encontraron el suyo. Empezá
            gratis, sin tarjeta, en menos de 3 minutos.
          </p>
          <Link href="/registrarse" className="btn btn-jade">
            Crear mi cuenta gratis →
          </Link>
          <div className="cta-note">
            Sin tarjeta · Setup en 3 min · Cancelá cuando quieras
          </div>
        </div>
      </div>
    </section>
  );
}
