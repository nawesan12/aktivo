import Link from "next/link";
import { PLAN_LIMITS, PLAN_PRICES } from "@/lib/subscription/config";
import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * Plans and prices. The section the whole page leads to.
 *
 * The figures come from the same place the panel and MercadoPago read, so the
 * landing cannot end up advertising a price nobody charges.
 */
const price = (plan: "PROFESSIONAL" | "ENTERPRISE") =>
  PLAN_PRICES[plan].amount.toLocaleString("es-AR");

const inicial = PLAN_LIMITS.PROFESSIONAL;

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
            {/* Every line here is read straight off PLAN_LIMITS below, so the
                page cannot promise a number the software does not enforce. */}
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Hasta {inicial.maxStaff}{" "}
                profesionales
              </li>
              <li>
                <span className="price-check">✓</span>{" "}
                {inicial.maxAppointmentsPerMonth} turnos por mes
              </li>
              <li>
                <span className="price-check">✓</span> Cobros con Mercado Pago
              </li>
              <li>
                <span className="price-check">✓</span> Ficha de cada cliente
              </li>
              <li>
                <span className="price-check">✓</span> Botón de reservas en tu web
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
              Para el local que ya trabaja lleno y quiere que el mes sea
              previsible.
            </p>
            <ul className="price-list">
              <li>
                <span className="price-check">✓</span> Membresías: cobrales un
                abono mensual
              </li>
              <li>
                <span className="price-check">✓</span> Campañas para traerlos de
                vuelta
              </li>
              <li>
                <span className="price-check">✓</span> Turnos y profesionales
                sin tope
              </li>
              <li>
                <span className="price-check">✓</span> Reportes avanzados
              </li>
              <li>
                <span className="price-check">✓</span> Varias sucursales y marca
                blanca
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
