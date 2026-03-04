import type { Metadata } from "next";
import { CalendarView } from "@/components/dashboard/calendar-view";

export const metadata: Metadata = {
  title: "Calendario",
};

export default function CalendarioPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Calendario</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Vista de calendario dia, semana y mes
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
