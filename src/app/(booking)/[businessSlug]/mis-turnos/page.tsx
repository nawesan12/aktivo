import { MisTurnosClient } from "./mis-turnos-client";

/**
 * A shell with nothing of its own to fetch: the portal asks for a phone, gets a
 * code by email, and only then reads anything. It was rendered on demand for
 * every visitor anyway, so it may as well come from the CDN.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

export default function MisTurnosPage() {
  return <MisTurnosClient />;
}
