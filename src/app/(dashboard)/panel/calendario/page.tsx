import type { Metadata } from "next";
import { CalendarView } from "@/components/dashboard/calendar-view";

export const metadata: Metadata = {
  title: "Calendario",
};

export default function CalendarioPage() {
  return (
    <div className="space-y-4">
      <CalendarView />
    </div>
  );
}
