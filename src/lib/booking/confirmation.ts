import { db } from "@/lib/db";

/**
 * Everything the confirmation ticket shows, read by appointment id.
 *
 * The screen used to render entirely from the Zustand store in sessionStorage,
 * and the `appointmentId` that `step-confirm` and MercadoPago's back_urls put
 * in the URL was never read. So: refreshing after the store reset showed an
 * empty page, coming back from MercadoPago in a different tab showed an empty
 * page, and `?pending=true` — a payment still being processed — said "¡Turno
 * confirmado!" all the same.
 *
 * The id is a cuid: unguessable, and already travelling in the URL because
 * MercadoPago sends the customer back with it. Scoped by slug so an id from one
 * business cannot be read through another's page.
 */
export async function getConfirmation(appointmentId: string, businessSlug: string) {
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, business: { slug: businessSlug } },
    select: {
      id: true,
      dateTime: true,
      endTime: true,
      status: true,
      userId: true,
      service: { select: { name: true, duration: true, price: true } },
      staff: { select: { name: true } },
      user: { select: { name: true, email: true } },
      guestClient: { select: { name: true, email: true } },
      business: {
        select: {
          name: true,
          slug: true,
          logo: true,
          address: true,
          city: true,
          settings: { select: { cancellationPolicy: true } },
        },
      },
      payment: { select: { amount: true, status: true } },
    },
  });

  if (!appointment) return null;

  const price = Number(appointment.service.price);
  const paid = appointment.payment?.status === "APPROVED" ? appointment.payment.amount : 0;

  return {
    id: appointment.id,
    dateTime: appointment.dateTime.toISOString(),
    endTime: appointment.endTime.toISOString(),
    status: appointment.status,
    serviceName: appointment.service.name,
    duration: appointment.service.duration,
    price,
    staffName: appointment.staff.name,
    clientName: appointment.user?.name ?? appointment.guestClient?.name ?? null,
    clientEmail: appointment.user?.email ?? appointment.guestClient?.email ?? null,
    /** Already tied to an account, so there is nothing to offer them. */
    clientHasAccount: Boolean(appointment.userId),
    business: {
      name: appointment.business.name,
      slug: appointment.business.slug,
      logo: appointment.business.logo,
      address: [appointment.business.address, appointment.business.city]
        .filter(Boolean)
        .join(", "),
      cancellationPolicy: appointment.business.settings?.cancellationPolicy ?? null,
    },
    paid,
    remaining: Math.max(price - paid, 0),
    /** True while MercadoPago is still deciding — the money is not in yet. */
    awaitingPayment:
      appointment.status === "PENDING_PAYMENT" || appointment.payment?.status === "PENDING",
  };
}

export type Confirmation = NonNullable<Awaited<ReturnType<typeof getConfirmation>>>;
