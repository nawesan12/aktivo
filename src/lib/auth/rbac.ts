import type { UserRole } from "@/generated/prisma/client";

export type Permission =
  | "appointments:read"
  | "appointments:create"
  | "appointments:update"
  | "appointments:delete"
  | "services:read"
  | "services:create"
  | "services:update"
  | "services:delete"
  | "staff:read"
  | "staff:create"
  | "staff:update"
  | "staff:delete"
  | "clients:read"
  | "clients:create"
  | "clients:update"
  | "clients:delete"
  | "clients:export"
  | "schedule:read"
  | "schedule:update"
  | "payments:read"
  | "payments:configure"
  | "notifications:read"
  | "notifications:configure"
  | "reports:read"
  | "reports:export"
  | "settings:read"
  | "settings:update"
  | "team:read"
  | "team:invite"
  | "team:manage"
  | "billing:read"
  | "billing:manage"
  | "audit:read"
  | "admin:access"
  // Sprint 7
  | "clients:tags"
  | "reviews:read"
  | "reviews:manage"
  // Sprint 8
  | "campaigns:read"
  | "campaigns:manage"
  | "noshow:read"
  | "noshow:manage"
  // Sprint 9
  | "group:read"
  | "group:manage"
  | "group:reports"
  // Sprint 10
  | "analytics:read"
  | "widget:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PLATFORM_ADMIN: [
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "services:read", "services:create", "services:update", "services:delete",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "clients:read", "clients:create", "clients:update", "clients:delete", "clients:export",
    "schedule:read", "schedule:update",
    "payments:read", "payments:configure",
    "notifications:read", "notifications:configure",
    "reports:read", "reports:export",
    "settings:read", "settings:update",
    "team:read", "team:invite", "team:manage",
    "billing:read", "billing:manage",
    "audit:read",
    "admin:access",
    "clients:tags", "reviews:read", "reviews:manage",
    "campaigns:read", "campaigns:manage", "noshow:read", "noshow:manage",
    "group:read", "group:manage", "group:reports",
    "analytics:read", "widget:manage",
  ],
  BUSINESS_OWNER: [
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "services:read", "services:create", "services:update", "services:delete",
    "staff:read", "staff:create", "staff:update", "staff:delete",
    "clients:read", "clients:create", "clients:update", "clients:delete", "clients:export",
    "schedule:read", "schedule:update",
    "payments:read", "payments:configure",
    "notifications:read", "notifications:configure",
    "reports:read", "reports:export",
    "settings:read", "settings:update",
    "team:read", "team:invite", "team:manage",
    "billing:read", "billing:manage",
    "audit:read",
    "clients:tags", "reviews:read", "reviews:manage",
    "campaigns:read", "campaigns:manage", "noshow:read", "noshow:manage",
    "group:read", "group:manage", "group:reports",
    "analytics:read", "widget:manage",
  ],
  BUSINESS_MANAGER: [
    "appointments:read", "appointments:create", "appointments:update", "appointments:delete",
    "services:read", "services:create", "services:update",
    "staff:read", "staff:create", "staff:update",
    "clients:read", "clients:create", "clients:update", "clients:export",
    "schedule:read", "schedule:update",
    "payments:read",
    "notifications:read",
    "reports:read", "reports:export",
    "settings:read",
    "team:read",
    "audit:read",
    "clients:tags", "reviews:read",
    "campaigns:read", "noshow:read",
    "group:read",
    "analytics:read",
  ],
  STAFF_MEMBER: [
    "appointments:read", "appointments:create", "appointments:update",
    "services:read",
    "clients:read",
    "schedule:read", "schedule:update",
    "reports:read",
    "clients:tags", "reviews:read",
    "noshow:read",
  ],
  RECEPTIONIST: [
    "appointments:read", "appointments:create", "appointments:update",
    "services:read",
    "clients:read", "clients:create",
    "schedule:read",
  ],
  CLIENT: [
    "appointments:read", "appointments:create",
    "services:read",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function requirePermission(role: UserRole | undefined, permission: Permission): void {
  if (!role || !hasPermission(role, permission)) {
    throw new Error(`Permisos insuficientes: requiere ${permission}`);
  }
}
