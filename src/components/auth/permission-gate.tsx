"use client";

import { useSession } from "next-auth/react";
import { hasPermission, type Permission } from "@/lib/auth/rbac";
import type { UserRole } from "@/generated/prisma/client";
import type { ReactNode } from "react";

interface PermissionGateProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { data: session } = useSession();
  const role = session?.user?.role as UserRole | undefined;

  if (!role || !hasPermission(role, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
