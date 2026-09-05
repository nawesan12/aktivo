import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getConfirmation } from "@/lib/booking/confirmation";
import { ConfirmationContent } from "@/components/booking/confirmation-content";
import { BookingStatusCard } from "@/components/booking/booking-status-card";
import { getBusinessProfile } from "@/lib/booking/business-page";
import { PLAN_LIMITS } from "@/lib/subscription/config";

interface Props {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ appointmentId?: string }>;
}

export const metadata: Metadata = {
  title: "Turno confirmado",
  robots: { index: false, follow: false },
};

/**
 * Rendered from the appointment, on the server.
 *
 * It used to be a client component reading the booking store out of
 * sessionStorage — so the `appointmentId` that this route has always received,
 * from the wizard and from MercadoPago's back_urls alike, was never used, and
 * anything that lost the store lost the page.
 */
export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { businessSlug } = await params;
  const { appointmentId } = await searchParams;

  if (!appointmentId) {
    return (
      <div className="bg-dots flex min-h-screen items-center justify-center px-[22px]">
        <BookingStatusCard
          icon="?"
          title="No sabemos qué turno mostrarte"
          className="w-full max-w-[430px]"
          actions={
            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/mis-turnos"
                className="rounded-[10px] bg-primary px-6 py-3 text-[12.5px] font-bold text-primary-foreground"
              >
                Ver mis turnos
              </Link>
              <Link
                href={`/${businessSlug}`}
                className="text-[12px] text-muted-foreground hover:text-foreground"
              >
                Volver al local
              </Link>
            </div>
          }
        >
          Este link llegó sin la referencia del turno. Si acabás de reservar, buscalo en tus turnos
          con el email que usaste.
        </BookingStatusCard>
      </div>
    );
  }

  const appointment = await getConfirmation(appointmentId, businessSlug);
  if (!appointment) notFound();

  const business = await getBusinessProfile(businessSlug);

  return (
    <ConfirmationContent
      appointment={appointment}
      whiteLabel={business ? PLAN_LIMITS[business.plan].whiteLabel : false}
    />
  );
}
