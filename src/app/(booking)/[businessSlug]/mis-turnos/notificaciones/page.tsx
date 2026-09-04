import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessIdentity } from "@/lib/booking/business-page";
import { GuestNotificationPreferences } from "./preferences-client";

export const metadata: Metadata = {
  title: "Preferencias de notificación",
  robots: { index: false, follow: false },
};

/**
 * The screen behind the gear on "Mis turnos".
 *
 * The link has been there since the page was written and pointed at a 404: a
 * client who wanted to stop the reminder emails clicked "Preferencias de
 * notificación" and got Not Found. The API it needs already existed, with
 * nothing calling it.
 */
export default async function GuestNotificationsPage({
  params,
}: {
  params: Promise<{ businessSlug: string }>;
}) {
  const { businessSlug } = await params;
  const business = await getBusinessIdentity(businessSlug);

  if (!business) notFound();

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <GuestNotificationPreferences slug={business.slug} businessName={business.name} />
    </div>
  );
}
