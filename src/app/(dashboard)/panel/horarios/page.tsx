import type { Metadata } from "next";
import { ScheduleEditor } from "@/components/dashboard/schedule-editor";

export const metadata: Metadata = {
  title: "Horarios",
};

export default function HorariosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-heading font-bold">Horarios</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configura los horarios de atencion de tu equipo
        </p>
      </div>
      <ScheduleEditor />
    </div>
  );
}
