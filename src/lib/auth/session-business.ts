import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { UserRole } from "@/generated/prisma/client";
import { AuthError } from "@/lib/api-errors";

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
