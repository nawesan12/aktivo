import { auth } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";

export interface SessionBusiness {
  userId: string;
  businessId: string;
  businessSlug?: string;
  role: UserRole;
}

export async function getSessionBusiness(): Promise<SessionBusiness> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("No autenticado");
  }

  if (!session.user.businessId) {
    throw new Error("Sin negocio asociado");
  }

  return {
    userId: session.user.id,
    businessId: session.user.businessId,
    businessSlug: session.user.businessSlug,
    role: session.user.role as UserRole,
  };
}
