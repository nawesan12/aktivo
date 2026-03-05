import { db } from "@/lib/db";

interface SmartSuggestion {
  dayOfWeek: number;
  time: string;
  staffId: string;
  staffName: string;
  confidence: number; // 0-1
  reason: string;
}

/**
 * Suggest optimal booking slots based on client's historical patterns.
 * Analyzes past appointments: same day-of-week, time, staff preferences.
 */
export async function getSmartSuggestions({
  businessId,
  userId,
  guestClientId,
  serviceId,
}: {
  businessId: string;
  userId?: string | null;
  guestClientId?: string | null;
  serviceId?: string;
}): Promise<SmartSuggestion[]> {
  if (!userId && !guestClientId) return [];

  const where: Record<string, unknown> = {
    businessId,
    status: { in: ["COMPLETED", "CONFIRMED"] },
  };

  if (userId) where.userId = userId;
  else if (guestClientId) where.guestClientId = guestClientId;

  const pastAppointments = await db.appointment.findMany({
    where,
    select: {
      dateTime: true,
      staffId: true,
      serviceId: true,
      staff: { select: { name: true } },
    },
    orderBy: { dateTime: "desc" },
    take: 50,
  });

  if (pastAppointments.length < 2) return [];

  // Analyze day-of-week + time patterns
  const dayTimeMap = new Map<string, { count: number; staffId: string; staffName: string }>();

  for (const apt of pastAppointments) {
    const dt = new Date(apt.dateTime);
    const dayOfWeek = dt.getDay();
    const hour = dt.getHours().toString().padStart(2, "0");
    const minute = (Math.round(dt.getMinutes() / 30) * 30).toString().padStart(2, "0");
    const key = `${dayOfWeek}-${hour}:${minute}-${apt.staffId}`;

    const existing = dayTimeMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      dayTimeMap.set(key, { count: 1, staffId: apt.staffId, staffName: apt.staff.name });
    }
  }

  // Filter same service if specified
  const staffPreference = serviceId
    ? pastAppointments.filter((a) => a.serviceId === serviceId)
    : pastAppointments;

  // Most frequent staff for this service
  const staffCounts = new Map<string, { count: number; name: string }>();
  for (const apt of staffPreference) {
    const existing = staffCounts.get(apt.staffId);
    if (existing) existing.count++;
    else staffCounts.set(apt.staffId, { count: 1, name: apt.staff.name });
  }

  // Build suggestions sorted by confidence
  const suggestions: SmartSuggestion[] = [];

  for (const [key, value] of dayTimeMap.entries()) {
    const [dayStr, time, staffId] = key.split("-");
    const dayOfWeek = parseInt(dayStr);
    const confidence = Math.min(value.count / pastAppointments.length, 1);

    if (confidence >= 0.15) {
      const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      suggestions.push({
        dayOfWeek,
        time: time,
        staffId,
        staffName: value.staffName,
        confidence,
        reason: `Suele reservar los ${dayNames[dayOfWeek]} a las ${time}`,
      });
    }
  }

  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}
