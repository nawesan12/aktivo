import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export async function logAction({
  businessId,
  userId,
  action,
  entity,
  entityId,
  details,
}: {
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        businessId: businessId ?? null,
        userId: userId ?? null,
        action,
        entity,
        entityId: entityId ?? null,
        details: (details as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}
