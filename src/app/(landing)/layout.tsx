import { appUrl } from "@/lib/env";
import { Providers } from "@/components/providers";
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES } from "@/lib/subscription/config";
import { TRIAL_DAYS } from "@/lib/subscription/access";
const inicial = PLAN_LIMITS.PROFESSIONAL;

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jiku",
    url: appUrl(),
    logo: appUrl("/jiku-logo.svg"),
    description:
      "Plataforma de gestión de turnos, CRM, pagos y fidelización para negocios de servicios en Argentina.",
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Jiku",
    url: appUrl(),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Inicial",
        price: String(PLAN_PRICES.PROFESSIONAL.amount),
        priceCurrency: PLAN_PRICES.PROFESSIONAL.currency,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(PLAN_PRICES.PROFESSIONAL.amount),
          priceCurrency: PLAN_PRICES.PROFESSIONAL.currency,
          billingDuration: "P1M",
        },
        description: `Hasta ${inicial.maxStaff} profesionales, ${inicial.maxAppointmentsPerMonth} turnos por mes, confirmaciones por email, cobros con MercadoPago`,
      },
      {
        "@type": "Offer",
        name: "Completo",
        price: String(PLAN_PRICES.ENTERPRISE.amount),
        priceCurrency: PLAN_PRICES.ENTERPRISE.currency,
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: String(PLAN_PRICES.ENTERPRISE.amount),
          priceCurrency: PLAN_PRICES.ENTERPRISE.currency,
          billingDuration: "P1M",
        },
        description:
          "Todo lo del plan Inicial, profesionales ilimitados, multi-sucursal, marca blanca",
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "¿Cuánto tarda la configuración inicial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Menos de 5 minutos. Creás tu cuenta, agregás tus servicios y profesionales, y ya podés compartir tu link de reservas.",
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo es la prueba gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Son ${TRIAL_DAYS} días con todas las funcionalidades desbloqueadas y sin tarjeta de crédito. Al terminar elegís un plan; si no elegís ninguno, seguís viendo toda tu información y tu página de reservas sigue funcionando.`,
        },
      },
      {
        "@type": "Question",
        name: "¿Cómo funcionan los pagos con MercadoPago?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Conectás tu cuenta de MercadoPago en 2 clicks. Tus clientes pagan señas o el total al reservar, y el dinero va directo a tu cuenta.",
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo migrar mis datos desde otra plataforma?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, ofrecemos asistencia para migrar tu base de clientes e historial. Contactá a nuestro equipo y te ayudamos sin costo.",
        },
      },
      {
        "@type": "Question",
        name: "¿Hay límite de turnos en los planes pagos?",
        acceptedAnswer: {
          "@type": "Answer",
          // Interpolated, and named as the customer sees them. This answer used
          // to promise unlimited turnos on "Starter y Professional" — a ceiling
          // the code enforces at 300 and two plan names that appear nowhere in
          // the product. It is structured data: Google can print it as the
          // answer, so a shop can arrive already believing it.
          text: `El plan ${PLAN_NAMES.PROFESSIONAL} incluye ${inicial.maxAppointmentsPerMonth} turnos por mes, que alcanzan para un local trabajando todos los días. El plan ${PLAN_NAMES.ENTERPRISE} no tiene tope.`,
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo gestionar múltiples sucursales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `Sí, con el plan ${PLAN_NAMES.ENTERPRISE} gestionás todas tus sucursales desde una sola cuenta, cada una con su configuración independiente.`,
        },
      },
      {
        "@type": "Question",
        name: "¿Qué tipo de soporte ofrecen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Soporte por chat y email en español. Los planes pagos tienen soporte prioritario con respuesta en menos de 2 horas.",
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo cancelar en cualquier momento?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, sin preguntas ni permanencia mínima. Cancelás desde tu panel y seguís usando la plataforma.",
        },
      },
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Jiku",
    url: appUrl(),
    potentialAction: {
      "@type": "SearchAction",
      target: appUrl("/explorar?q={search_term_string}"),
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <Providers>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd),
        }}
      />
      {children}
    </Providers>
  );
}
