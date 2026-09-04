import type { Metadata, Viewport } from "next";
import { Sora, Cormorant_Garamond, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { appUrl } from "@/lib/env";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  /**
   * Lets the page reach under the notch and the home indicator, which is what
   * makes `env(safe-area-inset-*)` report anything other than zero. Without it
   * the panel header sat behind the iPhone status bar — the icons looked
   * shoved up against the clock and out of line with each other — and an
   * installed PWA, which fills the whole screen, had it worse.
   *
   * The insets are then paid back as padding, in `globals.css` and on the two
   * headers that sit at the top of a screen.
   */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
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
    "recordatorios automaticos de turnos",
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
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/jiku-logo.svg", type: "image/svg+xml" },
      { url: "/jiku-logo-192.png", type: "image/png", sizes: "192x192" },
      { url: "/jiku-logo.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
  },
  // Same words as the card image, on purpose: a title that describes a category
  // next to an image that makes a promise reads like two different products.
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Jiku",
    title: "Jiku — tu agenda se mueve sola",
    description:
      "Turnos online 24/7, cobros con Mercado Pago y recordatorios automáticos para barberías, salones y negocios de servicios en Argentina.",
    url: appUrl(),
  },
  twitter: {
    card: "summary_large_image",
    title: "Jiku — tu agenda se mueve sola",
    description:
      "Turnos online 24/7, cobros con Mercado Pago y recordatorios automáticos para barberías, salones y negocios de servicios en Argentina.",
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
    canonical: appUrl(),
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
      {/*
        No providers here on purpose. The embeddable widget renders inside this
        same root layout, on our customers' own websites — the app-wide
        providers (and the service worker registration that came with them) have
        no business running there. Each route group brings its own, and
        `(widget)` deliberately brings almost none.
      */}
      <body className="min-h-screen">
        {/*
          Keyboard users would otherwise tab through the whole navigation on
          every page before reaching the content. Visible only when focused.
        */}
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
