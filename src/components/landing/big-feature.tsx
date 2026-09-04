/**
 * The one capability worth its own section.
 */
export function BigFeature() {
  return (
    <section className="big-feature">
      <div className="container">
        <div className="big-feature-grid">
          <div className="jiku-reveal">
            <div className="section-eyebrow">Comunicación</div>
            <div className="section-title">
              Avisos en
              <br />
              piloto automático
            </div>
            <p className="section-desc" style={{ marginTop: 16 }}>
              Jiku manda la confirmación al reservar, el recordatorio 24 h antes
              y el pedido de reseña después. Todo automático, todo con el nombre
              y los colores de tu negocio.
            </p>
            {/*
              These were "-73% ausencias" and "+45% reseñas en Google",
              invented for a product that had never had a customer. What is here
              now describes what the software does, which is checkable.
            */}
            <div
              style={{ marginTop: 32, display: "flex", gap: 32 }}
            >
              <div>
                <div className="jade" style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                  24 h
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  antes, el recordatorio
                </div>
              </div>
              <div>
                <div style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--gold)" }}>
                  0
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  mensajes que mandás vos
                </div>
              </div>
            </div>
          </div>
          <div className="bf-visual jiku-reveal rd3">
            <div className="wa">
              <div className="wa-head">
                {/* Email, which is what the product actually sends. The mockup
                    kept the shape of a chat thread from when this was WhatsApp. */}
                <div className="wa-icon">✉️</div>
                <div>
                  <div className="wa-name">Avisos de Jiku</div>
                  <div className="wa-sub">Por email, automáticos</div>
                </div>
              </div>
              <div className="wa-msgs">
                <div className="wa-msg">
                  <strong>¡Hola Lucía! 👋</strong>
                  <br />
                  Te recordamos tu turno mañana a las 10:00 con Martín.
                  <br />
                  Servicio: Corte + Color
                  <br />
                  <br />
                  ✅ Confirmar &nbsp; ❌ Cancelar
                  <span className="wa-time">14:30</span>
                </div>
                <div className="wa-msg">
                  <strong>¡Turno confirmado!</strong> ✨
                  <br />
                  Te esperamos mañana. Llegá 5 min antes.
                  <br />
                  📍 Av. Santa Fe 2431, CABA
                  <span className="wa-time">14:31</span>
                </div>
                <div className="wa-msg">
                  <strong>¡Gracias por tu visita!</strong> 💇‍♀️
                  <br />
                  ¿Cómo fue tu experiencia? Dejanos tu reseña y sumá puntos 🎁
                  <span className="wa-time">12:15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
