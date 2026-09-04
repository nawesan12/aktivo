import Link from "next/link";
import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * Above-the-fold pitch. Server-rendered, so the headline is in the HTML.
 */
export function Hero() {
  return (
    <section className="hero">
      <div className="hero-axis" />
      <div className="hero-glow" />
      <div className="container">
        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-kanji serif">軸 · EL EJE DE TU NEGOCIO</div>
            <h1>
              Tu agenda
              <br />
              <span className="line-2 serif">se mueve sola</span>
            </h1>
            <p className="hero-desc">
              Reservas 24/7. Confirmación al instante. Cobros integrados. CRM
              inteligente. Todo girando alrededor de un solo <span className="jade">eje</span>: Jiku.
            </p>
            <div className="hero-ctas">
              <Link href="/registrarse" className="btn btn-jade">
                Probar {TRIAL_DAYS} días gratis →
              </Link>
              <a
                href="#features"
                className="btn btn-ghost"
              >
                Ver demo en vivo
              </a>
            </div>
            {/* These were "12,400+ negocios activos", "2.8M turnos / mes" and
                "-73% ausencias", on a product that has never had a customer.
                Three fabricated numbers in the first screen anybody sees, and
                the kind of claim that is trivially checkable — a prospect who
                asks which twelve thousand businesses stops believing the rest
                of the page too.

                What replaces them is what we can actually promise today. */}
            <div className="hero-metrics">
              <div>
                <div className="hero-metric-num">7 días</div>
                <div className="hero-metric-label">Gratis, sin tarjeta</div>
              </div>
              <div>
                <div className="hero-metric-num">5 min</div>
                <div className="hero-metric-label">Y tu link está andando</div>
              </div>
              <div>
                <div className="hero-metric-num">24/7</div>
                <div className="hero-metric-label">Tu agenda toma turnos</div>
              </div>
            </div>
          </div>

          {/* PHONE */}
          <div className="hero-right">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-screen">
                <div className="ps-header">
                  <div>
                    <div className="ps-greeting">Buenos días 👋</div>
                    <div className="ps-name">Studio Martín</div>
                  </div>
                  <div className="ps-avatar">SM</div>
                </div>
                <div className="ps-stats">
                  <div className="ps-stat">
                    <div className="ps-stat-val green">18</div>
                    <div className="ps-stat-lbl">Turnos hoy</div>
                  </div>
                  <div className="ps-stat">
                    <div className="ps-stat-val gold">$284k</div>
                    <div className="ps-stat-lbl">Facturado / mes</div>
                  </div>
                </div>
                <div className="ps-section">Próximos turnos</div>
                <div className="ps-appt">
                  <div className="ps-time">
                    <div className="ps-time-h">10:00</div>
                    <div className="ps-time-p">AM</div>
                  </div>
                  <div className="ps-bar g" />
                  <div className="ps-info">
                    <div className="ps-client">Lucía Fernández</div>
                    <div className="ps-service">Corte + Color</div>
                  </div>
                  <span className="ps-badge badge-ok">✓ OK</span>
                </div>
                <div className="ps-appt">
                  <div className="ps-time">
                    <div className="ps-time-h">11:30</div>
                    <div className="ps-time-p">AM</div>
                  </div>
                  <div className="ps-bar y" />
                  <div className="ps-info">
                    <div className="ps-client">Matías López</div>
                    <div className="ps-service">Barba + Degradé</div>
                  </div>
                  <span className="ps-badge badge-wait">Espera</span>
                </div>
                <div className="ps-appt">
                  <div className="ps-time">
                    <div className="ps-time-h">12:15</div>
                    <div className="ps-time-p">PM</div>
                  </div>
                  <div className="ps-bar p" />
                  <div className="ps-info">
                    <div className="ps-client">Camila Ruiz</div>
                    <div className="ps-service">Alisado definitivo</div>
                  </div>
                  <span className="ps-badge badge-paid">$ Pagado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
