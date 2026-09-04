/**
 * The numbers under the product.
 *
 * These used to be "73% menos ausencias", "2.4x más reservas", "15h ahorradas
 * por semana" and "4.9★ de calificación promedio" — for a product that had
 * never had a customer. Made-up outcome metrics are the easiest thing on a
 * landing page to write and the hardest to defend when somebody asks where
 * they come from.
 *
 * What is here instead is checkable against the product itself.
 */
export function Stats() {
  return (
    <section className="stats">
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card jiku-reveal">
            <div className="stat-num">24/7</div>
            <div className="stat-label">Tu agenda toma turnos</div>
          </div>
          <div className="stat-card jiku-reveal rd1">
            <div className="stat-num">1%</div>
            <div className="stat-label">De comisión sobre lo que cobrás</div>
          </div>
          <div className="stat-card jiku-reveal rd2">
            <div className="stat-num">5 min</div>
            <div className="stat-label">De la cuenta al primer turno</div>
          </div>
          <div className="stat-card jiku-reveal rd3">
            <div className="stat-num">$0</div>
            <div className="stat-label">Hasta que decidas seguir</div>
          </div>
        </div>
      </div>
    </section>
  );
}
