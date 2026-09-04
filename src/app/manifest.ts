import type { MetadataRoute } from "next";

/**
 * The installed app.
 *
 * `start_url` is the panel, not the landing: someone who put Jiku on their home
 * screen is the owner opening their agenda between clients, and launching them
 * into the sales page — an ad for what they already pay for — was the wrong
 * first screen every single time. Signed out, the panel sends them to the login
 * page, which is also right.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity, so a change of `start_url` is treated as the same app
    // being updated rather than a second one being installed.
    id: "/",
    name: "Jiku - Plataforma de Crecimiento para Negocios de Servicios",
    short_name: "Jiku",
    description:
      "Turnos, CRM, pagos y fidelización para barberías, salones y negocios de servicios.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es-AR",
    dir: "ltr",
    // Long-press on the installed icon. The two things an owner opens the app
    // to do, one tap from the home screen.
    shortcuts: [
      {
        name: "Cargar un turno",
        short_name: "Nuevo turno",
        url: "/panel/turnos",
        description: "Anotar a alguien que llamó o vino sin turno",
      },
      {
        name: "Agenda de hoy",
        short_name: "Hoy",
        url: "/panel/calendario",
        description: "Los turnos del día",
      },
    ],
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
        src: "/jiku-logo-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
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
