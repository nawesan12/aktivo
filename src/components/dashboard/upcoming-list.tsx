"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, User } from "lucide-react";
import { StatusBadge } from "./status-badge";

interface UpcomingAppointment {
  id: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  status: string;
}

interface UpcomingListProps {
  appointments: UpcomingAppointment[];
}

export function UpcomingList({ appointments }: UpcomingListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No hay turnos proximos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => (
        <div
          key={apt.id}
          className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{apt.clientName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {apt.serviceName} · {apt.staffName} ·{" "}
              {format(new Date(apt.dateTime), "HH:mm", { locale: es })}
            </p>
          </div>
          <StatusBadge status={apt.status} />
        </div>
      ))}
    </div>
  );
}
