import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import { AuthError } from "@/lib/api-errors";
import { requirePermission, isReadOnly, type Permission } from "@/lib/auth/rbac";
import { assertBusinessCanWrite } from "@/lib/subscription/access";

export interface SessionBusiness {
  userId: string;
  businessId: string;
  businessSlug?: string;
  role: UserRole;
}

export interface SessionGroup {
  userId: string;
  groupId: string;
  groupName: string;
  businesses: { id: string; name: string; slug: string }[];
}

export async function getSessionBusiness(): Promise<SessionBusiness> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new AuthError();
  }

  if (!session.user.businessId) {
    throw new AuthError("Sin negocio asociado");
  }

  return {
    userId: session.user.id,
    businessId: session.user.businessId,
    businessSlug: session.user.businessSlug,
    role: session.user.role as UserRole,
  };
}

/**
 * Get the business group for the current user's active business.
 * Returns null if the business is not part of a group.
 */
export async function getSessionGroup(): Promise<SessionGroup | null> {
  const session = await getSessionBusiness();

  const business = await db.business.findUnique({
    where: { id: session.businessId },
    select: { groupId: true },
  });

  if (!business?.groupId) return null;

  const group = await db.businessGroup.findUnique({
    where: { id: business.groupId },
    include: {
      businesses: {
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!group) return null;

  return {
    userId: session.userId,
    groupId: group.id,
    groupName: group.name,
    businesses: group.businesses,
  };
}

/**
 * The single gate for a panel request: may this role do this, and is this
 * business still allowed to operate?
 *
 * Every route under /api/panel already went through `requirePermission`, so
 * folding the subscription check in here is what makes the block real instead
 * of a message on a screen anyone can skip by calling the API directly.
 *
 * Reads always pass. A business whose trial ran out keeps full visibility of
 * its own data — locking someone out of their agenda because they did not pay
 * is not leverage, it is hostage-taking.
 */
export async function requireBusinessPermission(
  session: SessionBusiness,
  permission: Permission
): Promise<void> {
  requirePermission(session.role, permission);

  if (!isReadOnly(permission)) {
    await assertBusinessCanWrite(session.businessId);
  }
}
