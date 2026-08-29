import Link from "next/link";

/**
 * Plans and prices. The section the whole page leads to.
 */
export function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="jiku-reveal" style={{ textAlign: "center" }}>
          <div className="section-eyebrow">Planes</div>
          <div className="section-title">
            Simple. Transparente.
            <br />
            Sin letra chica.
          </div>
        </div>
        <div className="pricing-grid">
          <div className="price-card jiku-reveal rd1">
            <div className="price-tier">Starter</div>
            <div className="price-amount">
              <span className="price-sign">$</span>
              <span className="price-val">0</span>
            </div>
            <div className="price-period">Gratis para siempre</div>
            <p className="price-desc">
              Para arrancar. Todo lo básico para dejar la libreta atrás.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> 1 profesional
              </li>
              <li>
                <span className="price-check">✓</span> Reservas 24/7
              </li>
              <li>
                <span className="price-check">✓</span> Recordatorios WhatsApp
              </li>
              <li>
                <span className="price-check">✓</span> Hasta 50 turnos/mes
              </li>
            </ul>
            <Link href="/registrarse" className="btn btn-ghost">
              Comenzar gratis
            </Link>
          </div>
          <div className="price-card featured jiku-reveal rd2">
            <div className="price-tier">Pro</div>
            <div className="price-amount">
              <span className="price-sign">$</span>
              <span className="price-val">4.990</span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                /mes
              </span>
            </div>
            <div className="price-period">ARS · Facturación mensual</div>
            <p className="price-desc">
              Para negocios que quieren crecer en serio.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Hasta 5 profesionales
              </li>
              <li>
                <span className="price-check">✓</span> Turnos ilimitados
              </li>
              <li>
                <span className="price-check">✓</span> Cobros con Mercado Pago
              </li>
              <li>
                <span className="price-check">✓</span> CRM + fidelización
              </li>
              <li>
                <span className="price-check">✓</span> Reportes avanzados
              </li>
            </ul>
            <Link href="/registrarse?plan=PROFESSIONAL" className="btn btn-jade">
              Elegir Pro →
            </Link>
          </div>
          <div className="price-card jiku-reveal rd3">
            <div className="price-tier">Business</div>
            <div className="price-amount">
              <span className="price-sign">$</span>
              <span className="price-val">9.990</span>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                /mes
              </span>
            </div>
            <div className="price-period">ARS · Facturación mensual</div>
            <p className="price-desc">
              Multi-sucursal, equipo grande, automatización total.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Profesionales
                ilimitados
              </li>
              <li>
                <span className="price-check">✓</span> Multi-sucursal
              </li>
              <li>
                <span className="price-check">✓</span> API + integraciones
              </li>
              <li>
                <span className="price-check">✓</span> Soporte prioritario
              </li>
              <li>
                <span className="price-check">✓</span> Marca blanca
              </li>
            </ul>
            <Link href="/registrarse?plan=ENTERPRISE" className="btn btn-ghost">
              Elegir Business →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
