/**
 * Names a shop cannot take, because the platform already answers on them.
 *
 * A business's page lives at the root — `/{slug}` — so it shares a namespace
 * with every top-level route. A static route wins, which means a shop that
 * managed to register as "explorar" would simply have no public page, with
 * nothing anywhere saying why.
 */
const RESERVED = new Set([
  "admin",
  "api",
  "explorar",
  "iniciar-sesion",
  "invitacion",
  "mi-cuenta",
  "mis-turnos",
  "panel",
  "presentacion",
  "recuperar-contrasena",
  "registrarse",
  "review",
  "sin-conexion",
  "_next",
  "favicon.ico",
  "manifest.json",
  "robots.txt",
  "sitemap.xml",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED.has(slug.toLowerCase());
}
