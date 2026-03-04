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
    },
  });

  if (!business) redirect("/panel");

  const isComplete =
    !!business.description && business._count.services > 0 && business._count.staff > 0;

  if (isComplete) redirect("/panel");

  return <OnboardingWizard businessName={business.name} businessId={business.id} />;
}
