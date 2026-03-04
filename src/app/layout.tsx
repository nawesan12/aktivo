import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aktivo.com"),
  title: {
    default: "Aktivo - Plataforma de Crecimiento para Negocios de Servicios",
    template: "%s | Aktivo",
  },
  description:
    "Turnos, CRM, pagos y fidelizacion para barberias, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
  keywords: [
    "turnos online",
    "sistema de turnos",
    "agenda online",
    "reservas online",
    "turnos barberias",
    "turnos salones de belleza",
    "turnos estetica",
    "turnos consultorio",
    "turnos personal trainer",
    "turnos pilates",
    "turnos spa",
    "gestion de turnos argentina",
    "software de turnos",
    "plataforma de reservas",
    "agenda digital",
    "turnos con mercadopago",
    "cobrar turnos online",
    "crm para negocios",
    "fidelizacion de clientes",
    "notificaciones whatsapp turnos",
    "pagina de reservas gratis",
    "sistema de citas",
    "calendario de turnos",
    "gestion de negocios de servicios",
    "turnos ilimitados",
    "multi sucursal turnos",
    "barberias argentina",
    "salones argentina",
  ],
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Aktivo",
    title: "Aktivo - Plataforma de Crecimiento para Negocios de Servicios",
    description:
      "Turnos, CRM, pagos y fidelizacion para barberias, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
    url: "https://aktivo.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aktivo - Plataforma de Crecimiento para Negocios de Servicios",
    description:
      "Turnos, CRM, pagos y fidelizacion para barberias, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://aktivo.com",
  },
  authors: [{ name: "Aktivo" }],
  creator: "Aktivo",
  publisher: "Aktivo",
  category: "Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
