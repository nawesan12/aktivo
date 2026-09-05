import type { Metadata } from "next";
import { Suspense } from "react";

import { AppointmentsPortal } from "@/components/client/appointments-portal";

export const metadata: Metadata = {
  title: "Mis turnos",
  description: "Mirá, reprogramá o cancelá los turnos que reservaste con Jiku.",
  robots: { index: false, follow: false },
};

/**
 * One place for a customer's appointments, whichever shop they booked at.
 *
 * There used to be two, and neither was reachable. `/{negocio}/mis-turnos`
 * only knew about guests of that one shop and looked them up by a phone number
 * that a signed-in customer had never been asked for; `/mi-cuenta/turnos` sat
 * behind an account that only business owners could create. Nothing in the
 * public side linked to either.
 */
export default function MisTurnosPage() {
  // Required to prerender: the portal reads `?link=` with `useSearchParams`,
  // which is only known at request time.
  return (
    <Suspense fallback={null}>
      <AppointmentsPortal />
    </Suspense>
  );
}
