/**
 * Customer quotes.
 */
export function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="jiku-reveal" style={{ textAlign: "center" }}>
          <div className="section-eyebrow">Reseñas</div>
          <div className="section-title">
            Lo que dicen quienes
            <br />
            usan Jiku
          </div>
        </div>
        <div className="testi-grid">
          <div className="testi-card jiku-reveal rd1">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text serif">
              &ldquo;Pasé de perder 8 turnos por semana a casi cero. Los
              recordatorios por WhatsApp cambiaron todo. Mis clientes aman
              reservar a las 2am.&rdquo;
            </p>
            <div className="testi-author">
              <div
                className="testi-avatar"
                style={{
                  background:
                    "linear-gradient(135deg, var(--jade), var(--jade-deep))",
                }}
              >
                MR
              </div>
              <div>
                <div className="testi-name">Martín Rodríguez</div>
                <div className="testi-role">Blade Barbería · Palermo</div>
              </div>
            </div>
          </div>
          <div className="testi-card jiku-reveal rd2">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text serif">
              &ldquo;El CRM me permite saber exactamente qué necesita cada
              clienta. Implementé paquetes y mi facturación subió un 40% en 3
              meses.&rdquo;
            </p>
            <div className="testi-author">
              <div
                className="testi-avatar"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                }}
              >
                VS
              </div>
              <div>
                <div className="testi-name">Valentina Sosa</div>
                <div className="testi-role">Natural Spa · Recoleta</div>
              </div>
            </div>
          </div>
          <div className="testi-card jiku-reveal rd3">
            <div className="testi-stars">★★★★★</div>
            <p className="testi-text serif">
              &ldquo;Tengo 3 sucursales y las manejo desde una sola pantalla.
              Los reportes me dicen exactamente dónde mejorar. Es como tener
              un socio digital.&rdquo;
            </p>
            <div className="testi-author">
              <div
                className="testi-avatar"
                style={{
                  background:
                    "linear-gradient(135deg, var(--coral), #ef4444)",
                }}
              >
                FC
              </div>
              <div>
                <div className="testi-name">Federico Castro</div>
                <div className="testi-role">FitZone · 3 sedes GBA</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
