import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/dashboard/onboarding-wizard";

export default async function WelcomePage() {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/panel");

  const business = await db.business.findUnique({
    where: { id: session.user.businessId },
    select: {
      id: true,
      name: true,
      description: true,
      _count: { select: { services: true, staff: true } },
      staff: { select: { _count: { select: { workingHours: true } } } },
    },
  });

  if (!business) redirect("/panel");

  /*
    Hours count too.

    The check used to be description + a service + a professional, which a shop
    could satisfy and still not take a single booking: a professional with no
    working hours offers no slots. "Complete" now means the public page can
    actually answer someone.
  */
  const hasHours = business.staff.some((member) => member._count.workingHours > 0);
  const isComplete =
    !!business.description &&
    business._count.services > 0 &&
    business._count.staff > 0 &&
    hasHours;

  if (isComplete) redirect("/panel");

  return <OnboardingWizard businessName={business.name} businessId={business.id} />;
}
