import { TRIAL_DAYS } from "@/lib/subscription/access";

/**
 * How it works, in the place testimonials used to be.
 *
 * There were three of them, with names, photos-as-initials, neighbourhoods and
 * numbers: Martín Rodríguez of Blade Barbería in Palermo saying he went from
 * losing eight appointments a week to nearly none; Valentina Sosa of Natural
 * Spa in Recoleta reporting 40% more billing in three months. None of those
 * people exist, and the product had never had a customer.
 *
 * Invented reviews are worse than no reviews: they are checkable, and the first
 * prospect who asks to speak to one of them finds out everything else on the
 * page might be made up too. Real quotes go here the day there are some.
 *
 * Meanwhile this answers the question somebody at this point of the page is
 * actually asking, which is what happens if they sign up.
 */
const STEPS = [
  {
    number: "01",
    title: "Cargá lo tuyo",
    body: "Tus servicios, tu equipo y los horarios en que abrís. Cinco minutos, una sola vez.",
  },
  {
    number: "02",
    title: "Pasá tu link",
    body: "Va en tu Instagram, en el WhatsApp del local o en un QR sobre el mostrador. Tus clientes reservan solos, también a las dos de la mañana.",
  },
  {
    number: "03",
    title: "Ocupate de atender",
    body: "Jiku manda la confirmación apenas reservan, con el día, la hora y con quién. Si querés, cobra la seña en el mismo paso.",
  },
];

export function Testimonials() {
  return (
    <section className="testimonials" id="testimonials">
      <div className="container">
        <div className="jiku-reveal" style={{ textAlign: "center" }}>
          <div className="section-eyebrow">Cómo funciona</div>
          <div className="section-title">
            Tres pasos y tu agenda
            <br />
            empieza a llenarse sola
          </div>
        </div>
        <div className="testi-grid">
          {STEPS.map((step, index) => (
            <div key={step.number} className={`testi-card jiku-reveal rd${index + 1}`}>
              <div className="feature-num mono">{step.number}</div>
              <h3 className="testi-name" style={{ fontSize: "1.15rem", marginTop: 12 }}>
                {step.title}
              </h3>
              <p className="testi-text" style={{ fontSize: "0.98rem", marginTop: 8 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <p
          className="jiku-reveal"
          style={{
            textAlign: "center",
            marginTop: 32,
            color: "var(--text-muted)",
            fontSize: "0.95rem",
          }}
        >
          {TRIAL_DAYS} días gratis, sin tarjeta. Si no te sirve, no hacés nada.
        </p>
      </div>
    </section>
  );
}
