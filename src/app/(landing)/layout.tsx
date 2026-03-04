export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aktivo",
    url: "https://aktivo.com",
    logo: "https://aktivo.com/favicon.svg",
    description:
      "Plataforma de gestion de turnos, CRM, pagos y fidelizacion para negocios de servicios en Argentina.",
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Aktivo",
    url: "https://aktivo.com",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "ARS",
        description: "Hasta 50 turnos/mes, 1 profesional, pagina de reservas",
      },
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
        name: "Cuanto tarda la configuracion inicial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Menos de 5 minutos. Creas tu cuenta, agregas tus servicios y profesionales, y ya podes compartir tu link de reservas.",
        },
      },
      {
        "@type": "Question",
        name: "El plan gratuito es realmente gratis?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, 100% gratis para siempre. Sin tarjeta de credito, sin pruebas que vencen. Incluye hasta 50 turnos por mes y 1 profesional.",
        },
      },
      {
        "@type": "Question",
        name: "Como funcionan los pagos con MercadoPago?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Conectas tu cuenta de MercadoPago en 2 clicks. Tus clientes pagan senas o el total al reservar, y el dinero va directo a tu cuenta.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo migrar mis datos desde otra plataforma?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, ofrecemos asistencia para migrar tu base de clientes e historial. Contacta a nuestro equipo y te ayudamos sin costo.",
        },
      },
      {
        "@type": "Question",
        name: "Hay limite de turnos en los planes pagos?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Los planes Starter y Professional incluyen turnos ilimitados. Solo el plan Free tiene un limite de 50 turnos por mes.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo gestionar multiples sucursales?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, con el plan Professional podes gestionar todas tus sucursales desde una sola cuenta, cada una con su configuracion independiente.",
        },
      },
      {
        "@type": "Question",
        name: "Que tipo de soporte ofrecen?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Soporte por chat y email en espanol. Los planes pagos tienen soporte prioritario con respuesta en menos de 2 horas.",
        },
      },
      {
        "@type": "Question",
        name: "Puedo cancelar en cualquier momento?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Si, sin preguntas ni permanencia minima. Cancelas desde tu panel y seguis usando el plan Free.",
        },
      },
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aktivo",
    url: "https://aktivo.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://aktivo.com/{search_term_string}",
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
