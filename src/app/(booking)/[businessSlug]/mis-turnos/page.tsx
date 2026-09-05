import { redirect } from "next/navigation";

/**
 * The shop-scoped portal is now the platform-wide one.
 *
 * Kept as a redirect rather than deleted: this URL is in every confirmation and
 * reminder email already sent, and the appointment somebody is looking for is
 * on the other side of it either way — along with the ones they booked
 * elsewhere.
 */
export default function BusinessMisTurnosPage() {
  redirect("/mis-turnos");
}
