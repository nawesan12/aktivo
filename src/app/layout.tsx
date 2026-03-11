import type { Metadata } from "next";
import { Sora, Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  display: "swap",
  weight: ["400", "500"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jiku.app"),
  title: {
    default: "Jiku - Plataforma de Crecimiento para Negocios de Servicios",
    template: "%s | Jiku",
  },
  description:
    "Turnos, CRM, pagos y fidelización para barberías, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
  keywords: [
    "turnos online",
    "sistema de turnos",
    "agenda online",
    "reservas online",
    "turnos barberías",
    "turnos salones de belleza",
    "turnos estética",
    "turnos consultorio",
    "turnos personal trainer",
    "turnos pilates",
    "turnos spa",
    "gestión de turnos argentina",
    "software de turnos",
    "plataforma de reservas",
    "agenda digital",
    "turnos con mercadopago",
    "cobrar turnos online",
    "crm para negocios",
    "fidelización de clientes",
    "notificaciones whatsapp turnos",
    "pagina de reservas gratis",
    "sistema de citas",
    "calendario de turnos",
    "gestión de negocios de servicios",
    "turnos ilimitados",
    "multi sucursal turnos",
    "barberías argentina",
    "salones argentina",
  ],
  icons: {
    icon: [
      { url: "/jiku-logo.svg", type: "image/svg+xml" },
      { url: "/jiku-logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/jiku-logo.png", sizes: "512x512" },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Jiku",
    title: "Jiku - Plataforma de Crecimiento para Negocios de Servicios",
    description:
      "Turnos, CRM, pagos y fidelización para barberías, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
    url: "https://jiku.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiku - Plataforma de Crecimiento para Negocios de Servicios",
    description:
      "Turnos, CRM, pagos y fidelización para barberías, salones y negocios de servicios. La plataforma argentina que impulsa tu negocio.",
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
    canonical: "https://jiku.app",
  },
  authors: [{ name: "Jiku" }],
  creator: "Jiku",
  publisher: "Jiku",
  category: "Software",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={`${sora.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable} ${inter.variable} scroll-smooth`}>
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
