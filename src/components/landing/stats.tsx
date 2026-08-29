/**
 * Headline numbers.
 */
export function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card jiku-reveal">
            <div className="stat-num">73%</div>
            <div className="stat-label">Menos ausencias</div>
          </div>
          <div className="stat-card jiku-reveal rd1">
            <div className="stat-num">2.4x</div>
            <div className="stat-label">Más reservas online</div>
          </div>
          <div className="stat-card jiku-reveal rd2">
            <div className="stat-num">15h</div>
            <div className="stat-label">Ahorradas / semana</div>
          </div>
          <div className="stat-card jiku-reveal rd3">
            <div className="stat-num">4.9★</div>
            <div className="stat-label">Calificación promedio</div>
          </div>
        </div>
      </div>
    </section>
  );
}
