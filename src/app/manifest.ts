import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aktivo - Plataforma de Crecimiento para Negocios de Servicios",
    short_name: "Aktivo",
    description:
      "Turnos, CRM, pagos y fidelizacion para barberias, salones y negocios de servicios.",
    start_url: "/",
    display: "standalone",
    theme_color: "#6366f1",
    background_color: "#09090b",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
