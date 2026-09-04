import { Section, SectionEyebrow, SectionTitle } from "./section";

/**
 * Six claims, each one something the product actually does today. No invented
 * metrics: the repo's rule is that a number on a marketing page has to be
 * traceable to the code, and none of these are numbers.
 */
const FEATURES = [
  {
    title: "Agenda abierta 24/7",
    body: "Tus clientes reservan solos y sólo ven los huecos reales. Dos personas no pueden tomar el mismo horario ni queriendo.",
  },
  {
    title: "Confirmación al instante",
    body: "Apenas reservan, al cliente le llega el mail con el día, la hora y con quién. Vos no tocás nada.",
  },
  {
    title: "Cobrá la seña al reservar",
    body: "Conectás tu Mercado Pago con un botón y la plata entra directo a tu cuenta. Total, porcentaje o monto fijo.",
  },
  {
    title: "CRM que enamora",
    body: "Historial completo de cada cliente: hábitos, notas y cumpleaños a mano en cada turno.",
  },
  {
    title: "Reportes accionables",
    body: "Tu servicio estrella, tu mejor horario, quién factura más. No solo datos, respuestas.",
  },
  {
    title: "Cupones y referidos",
    body: "Descuentos con vencimiento y tope de usos, y un programa para premiar al cliente que te trae otro.",
  },
];

export function Features() {
  return (
    <Section id="funciones" ground="card" className="py-14 lg:py-16">
      <div className="mb-11 text-center">
        <SectionEyebrow>Funciones</SectionEyebrow>
        <SectionTitle>
          Todo lo que necesitás.
          <br />
          <span className="text-faint">Nada que sobre.</span>
        </SectionTitle>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <article
            key={feature.title}
            className="rounded-[14px] border border-border bg-background p-[26px] transition-[border-color,transform] duration-[250ms] hover:-translate-y-[3px] hover:border-primary"
          >
            <p className="mb-3 font-mono text-[10.5px] text-jade-link">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mb-1.5 text-[15px] font-bold">{feature.title}</h3>
            <p className="text-[13px] leading-[1.65] text-muted-foreground">{feature.body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
