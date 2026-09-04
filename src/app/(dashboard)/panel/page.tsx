import { auth } from "@/lib/auth";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { getDashboardStats } from "@/lib/panel/dashboard-stats";
import { DashboardContent } from "./dashboard-content";

/**
 * The panel's home, resolved on the server.
 *
 * It used to be a client component that rendered a skeleton, waited for the
 * session, then fetched `/api/panel/stats` — three round trips before a number
 * appeared. The query now runs while the page renders and the browser receives
 * the KPIs already filled in.
 */
export default async function DashboardPage() {
  const session = await getSessionBusiness();
  requirePermission(session.role, "reports:read");

  const [stats, authSession] = await Promise.all([
    getDashboardStats(session.businessId),
    auth(),
  ]);

  // First name only: "Buen día, Martín Lopez" reads like a form letter.
  const ownerName = (authSession?.user?.name ?? "").trim().split(/\s+/)[0] || "de nuevo";

  return <DashboardContent initialStats={stats} ownerName={ownerName} />;
}
