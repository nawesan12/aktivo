import Link from "next/link";
import { PLAN_PRICES } from "@/lib/subscription/config";
import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * Plans and prices. The section the whole page leads to.
 *
 * The figures come from the same place the panel and MercadoPago read, so the
 * landing cannot end up advertising a price nobody charges.
 */
const price = (plan: "PROFESSIONAL" | "ENTERPRISE") =>
  PLAN_PRICES[plan].amount.toLocaleString("es-AR");

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
          <p className="pricing-trial">
            {TRIAL_DAYS} días gratis, con todo desbloqueado y sin tarjeta.
            Después elegís.
          </p>
        </div>
        <div className="pricing-grid">
          <div className="price-card featured jiku-reveal rd1">
            <div className="price-tier">Inicial</div>
            <div className="price-amount">
              <span className="price-sign">$</span>
              <span className="price-val">{price("PROFESSIONAL")}</span>
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
              Para un local que quiere dejar la libreta atrás.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Hasta 3 profesionales
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
            <Link href="/registrarse" className="btn btn-jade">
              Probar gratis →
            </Link>
          </div>
          <div className="price-card jiku-reveal rd2">
            <div className="price-tier">Completo</div>
            <div className="price-amount">
              <span className="price-sign">$</span>
              <span className="price-val">{price("ENTERPRISE")}</span>
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
              Para barberías con mucho movimiento, equipo grande o más de un
              local.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Todo lo del plan Inicial
              </li>
              <li>
                <span className="price-check">✓</span> Profesionales ilimitados
              </li>
              <li>
                <span className="price-check">✓</span> Multi-sucursal
              </li>
              <li>
                <span className="price-check">✓</span> Marca blanca
              </li>
              <li>
                <span className="price-check">✓</span> Soporte prioritario
              </li>
            </ul>
            <Link href="/registrarse" className="btn btn-ghost">
              Probar gratis →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
