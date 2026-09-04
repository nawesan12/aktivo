/**
 * The feature grid.
 */
export function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-header jiku-reveal">
          <div className="section-eyebrow">Funciones</div>
          <div className="section-title">
            Todo lo que necesitás.
            <br />
            Nada que sobre.
          </div>
          <p className="section-desc">
            Cada función fue diseñada para resolver problemas reales de
            negocios que viven de su agenda.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature jiku-reveal rd1">
            <div className="feature-num mono">01</div>
            <h3>Agenda abierta 24/7</h3>
            <p>
              Tus clientes reservan solos a cualquier hora, y sólo ven los
              huecos que realmente tenés libres. Dos personas no pueden tomar
              el mismo horario ni queriendo.
            </p>
          </div>
          <div className="feature jiku-reveal rd2">
            <div className="feature-num mono">02</div>
            {/* This said "Recordatorios automáticos … sin que toques el
                celular". The reminder job runs off real traffic, which is what
                the free hosting plan allows, so "automático" was a promise the
                product cannot keep on its own. What it does do without any
                asterisk is confirm at the moment of booking. */}
            <h3>Confirmación al instante</h3>
            <p>
              Apenas reservan, al cliente le llega el mail con el día, la hora y
              con quién. Vos no tocás nada.
            </p>
          </div>
          <div className="feature jiku-reveal rd3">
            <div className="feature-num mono">03</div>
            <h3>Cobrá la seña al reservar</h3>
            <p>
              Conectás tu Mercado Pago con un botón y la plata entra directo a
              tu cuenta. Total, un porcentaje o un monto fijo: vos elegís.
            </p>
          </div>
          <div className="feature jiku-reveal rd1">
            <div className="feature-num mono">04</div>
            <h3>CRM que enamora</h3>
            <p>
              Historial completo de cada cliente. Campañas de
              fidelización, cumpleaños y reactivación.
            </p>
          </div>
          <div className="feature jiku-reveal rd2">
            <div className="feature-num mono">05</div>
            <h3>Reportes accionables</h3>
            <p>
              Insights reales: tu servicio estrella, tu mejor horario, qué
              profesional factura más. No solo datos, respuestas.
            </p>
          </div>
          <div className="feature jiku-reveal rd3">
            <div className="feature-num mono">06</div>
            <h3>Cupones y referidos</h3>
            <p>
              Códigos de descuento con vencimiento y tope de usos, y un
              programa para premiar al cliente que te trae otro cliente.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
