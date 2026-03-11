export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jiku",
    url: "https://jiku.app",
    logo: "https://jiku.app/jiku-logo.svg",
    description:
      "Plataforma de gestión de turnos, CRM, pagos y fidelización para negocios de servicios en Argentina.",
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Jiku",
    url: "https://jiku.app",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Starter",
        price: "4990",
        priceCurrency: "ARS",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "4990",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        description:
          "Turnos ilimitados, hasta 5 profesionales, WhatsApp + Email, pagos con MercadoPago",
      },
      {
        "@type": "Offer",
        name: "Professional",
        price: "9990",
        priceCurrency: "ARS",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "9990",
          priceCurrency: "ARS",
          billingDuration: "P1M",
        },
        description:
          "Todo de Starter, staff ilimitado, CRM avanzado, branding personalizado, API access",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
    },
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
        name: "¿El plan gratuito es realmente gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, 100% gratis para siempre. Sin tarjeta de crédito, sin pruebas que vencen. Incluye hasta 50 turnos por mes y 1 profesional.",
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
          text: "No. Los planes Starter y Professional incluyen turnos ilimitados.",
        },
      },
      {
        "@type": "Question",
        name: "¿Puedo gestionar múltiples sucursales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Sí, con el plan Professional podés gestionar todas tus sucursales desde una sola cuenta, cada una con su configuración independiente.",
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
    url: "https://jiku.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://jiku.app/{search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
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
    </>
  );
}
