import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jiku - Plataforma de Crecimiento para Negocios de Servicios",
    short_name: "Jiku",
    description:
      "Turnos, CRM, pagos y fidelización para barberías, salones y negocios de servicios.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    theme_color: "#4ADE80",
    background_color: "#09090b",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/jiku-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/jiku-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
