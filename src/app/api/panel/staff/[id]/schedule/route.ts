import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness } from "@/lib/auth/session-business";
import { requirePermission } from "@/lib/auth/rbac";
import { logAction } from "@/lib/audit";
import { handleApiError } from "@/lib/api-errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "schedule:read");

    const { id } = await params;

    const staff = await db.staffMember.findFirst({
      where: { id, businessId: session.businessId },
      select: { id: true, name: true },
    });
    if (!staff) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    const [workingHours, blockedDates, recurringBlocks, dateOverrides] = await Promise.all([
      db.workingHours.findMany({
        where: { staffId: id },
        orderBy: { dayOfWeek: "asc" },
      }),
      db.blockedDate.findMany({
        where: { staffId: id },
        orderBy: { date: "asc" },
      }),
      db.recurringBlockedSlot.findMany({
        where: { staffId: id },
        orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
      }),
      db.dateSlotOverride.findMany({
        where: { staffId: id },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
    ]);

    return NextResponse.json({
      staffId: id,
      staffName: staff.name,
      workingHours,
      blockedDates,
      recurringBlocks,
      dateOverrides,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    requirePermission(session.role, "schedule:update");

    const { id } = await params;
    const body = await request.json();

    const staff = await db.staffMember.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!staff) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // Update working hours
    if (body.workingHours) {
      for (const wh of body.workingHours) {
        await db.workingHours.upsert({
          where: {
            staffId_dayOfWeek: { staffId: id, dayOfWeek: wh.dayOfWeek },
          },
          update: {
            startTime: wh.startTime,
            endTime: wh.endTime,
            isActive: wh.isActive,
          },
          create: {
            staffId: id,
            dayOfWeek: wh.dayOfWeek,
            startTime: wh.startTime,
            endTime: wh.endTime,
            isActive: wh.isActive,
          },
        });
      }
    }

    // Replace blocked dates
    if (body.blockedDates) {
      await db.blockedDate.deleteMany({ where: { staffId: id } });
      if (body.blockedDates.length > 0) {
        await db.blockedDate.createMany({
          data: body.blockedDates.map((bd: { date: string; type: string; startTime?: string; endTime?: string; reason?: string }) => ({
            staffId: id,
            date: new Date(bd.date),
            type: bd.type || "FULL_DAY",
            startTime: bd.startTime || null,
            endTime: bd.endTime || null,
            reason: bd.reason || null,
          })),
        });
      }
    }

    // Replace recurring blocks
    if (body.recurringBlocks) {
      await db.recurringBlockedSlot.deleteMany({ where: { staffId: id } });
      if (body.recurringBlocks.length > 0) {
        await db.recurringBlockedSlot.createMany({
          data: body.recurringBlocks.map((rb: { dayOfWeek: number; time: string }) => ({
            staffId: id,
            dayOfWeek: rb.dayOfWeek,
            time: rb.time,
          })),
        });
      }
    }

    // Replace date overrides
    if (body.dateOverrides) {
      await db.dateSlotOverride.deleteMany({ where: { staffId: id } });
      if (body.dateOverrides.length > 0) {
        await db.dateSlotOverride.createMany({
          data: body.dateOverrides.map((dso: { date: string; time: string; type: string }) => ({
            staffId: id,
            date: new Date(dso.date),
            time: dso.time,
            type: dso.type || "BLOCKED",
          })),
        });
      }
    }

    await logAction({
      businessId: session.businessId,
      userId: session.userId,
      action: "schedule:update",
      entity: "StaffMember",
      entityId: id,
      details: { updated: Object.keys(body) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
