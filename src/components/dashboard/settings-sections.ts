/**
 * The sections of Configuración.
 *
 * A plain module, not part of `settings-nav.tsx`: that file is `"use client"`,
 * and a non-component export crossing that boundary arrives on the server as a
 * client reference rather than as the array — `SETTINGS_SECTIONS.some is not a
 * function`, at request time, only in the server render.
 */
/*
  "Negocio" no está más: el nombre, la dirección y el contacto son la web
  pública y se editan en Mi web, junto al resto de lo que ve un cliente. Tener
  las dos mitades en pantallas distintas —y la descripción editable en ambas—
  hacía que guardar en una pisara la otra.
*/
export const SETTINGS_SECTIONS = [
  { id: "reservas", label: "Reservas y señas" },
  { id: "avisos", label: "Recordatorios y envíos" },
  { id: "cancelaciones", label: "Cancelaciones y ausencias" },
  { id: "sucursales", label: "Sucursales" },
  { id: "historial", label: "Historial" },
] as const;

export type SettingsSection = (typeof SETTINGS_SECTIONS)[number]["id"];
