import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionBusiness, requireBusinessPermission } from "@/lib/auth/session-business";
import { logAction } from "@/lib/audit";
import { handleApiError, ValidationError } from "@/lib/api-errors";
import { scheduleSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionBusiness();
    await requireBusinessPermission(session, "schedule:read");

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
    await requireBusinessPermission(session, "schedule:update");

    const { id } = await params;

    const parsed = scheduleSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message || "Horario inválido");
    }
    const body = parsed.data;

    const staff = await db.staffMember.findFirst({
      where: { id, businessId: session.businessId },
    });
    if (!staff) {
      return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });
    }

    // One transaction for the whole schedule. Each block below is a delete
    // followed by a create, and without this a failure halfway through left the
    // member of staff with their blocked dates gone and nothing in their place.
    await db.$transaction(async (tx) => {
      if (body.workingHours) {
        for (const wh of body.workingHours) {
          await tx.workingHours.upsert({
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

      if (body.blockedDates) {
        await tx.blockedDate.deleteMany({ where: { staffId: id } });
        if (body.blockedDates.length > 0) {
          await tx.blockedDate.createMany({
            data: body.blockedDates.map((bd) => ({
              staffId: id,
              date: new Date(bd.date),
              type: bd.type,
              startTime: bd.startTime || null,
              endTime: bd.endTime || null,
              reason: bd.reason || null,
            })),
          });
        }
      }

      if (body.recurringBlocks) {
        await tx.recurringBlockedSlot.deleteMany({ where: { staffId: id } });
        if (body.recurringBlocks.length > 0) {
          await tx.recurringBlockedSlot.createMany({
            data: body.recurringBlocks.map((rb) => ({
              staffId: id,
              dayOfWeek: rb.dayOfWeek,
              time: rb.time,
            })),
          });
        }
      }

      if (body.dateOverrides) {
        await tx.dateSlotOverride.deleteMany({ where: { staffId: id } });
        if (body.dateOverrides.length > 0) {
          await tx.dateSlotOverride.createMany({
            data: body.dateOverrides.map((dso) => ({
              staffId: id,
              date: new Date(dso.date),
              time: dso.time,
              type: dso.type,
            })),
          });
        }
      }
    });

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
