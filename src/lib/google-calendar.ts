import { db } from "@/lib/db";
import { google } from "googleapis";

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
}

async function getAuthenticatedClient(staffUserId: string) {
  const account = await db.account.findFirst({
    where: { userId: staffUserId, provider: "google" },
  });

  if (!account?.access_token) {
    throw new Error("No Google account linked for staff user");
  }

  const client = getOAuth2Client();
  client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  return client;
}

interface CalendarEventData {
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
}

export async function createCalendarEvent(
  staffUserId: string,
  data: CalendarEventData
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(staffUserId);
    const calendar = google.calendar({ version: "v3", auth });

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: data.title,
        description: data.description,
        start: {
          dateTime: data.startTime.toISOString(),
          timeZone: "America/Argentina/Buenos_Aires",
        },
        end: {
          dateTime: data.endTime.toISOString(),
          timeZone: "America/Argentina/Buenos_Aires",
        },
      },
    });

    return event.data.id ?? null;
  } catch (error) {
    console.error("[Google Calendar] Create event error:", error);
    return null;
  }
}

export async function updateCalendarEvent(
  staffUserId: string,
  eventId: string,
  data: Partial<CalendarEventData>
): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(staffUserId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: {
        ...(data.title && { summary: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.startTime && {
          start: {
            dateTime: data.startTime.toISOString(),
            timeZone: "America/Argentina/Buenos_Aires",
          },
        }),
        ...(data.endTime && {
          end: {
            dateTime: data.endTime.toISOString(),
            timeZone: "America/Argentina/Buenos_Aires",
          },
        }),
      },
    });
  } catch (error) {
    console.error("[Google Calendar] Update event error:", error);
  }
}

export async function deleteCalendarEvent(
  staffUserId: string,
  eventId: string
): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(staffUserId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId,
    });
  } catch (error) {
    console.error("[Google Calendar] Delete event error:", error);
  }
}
