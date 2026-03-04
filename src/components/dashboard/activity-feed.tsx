"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  CreditCard,
  Settings,
  UserPlus,
  Scissors,
  Bell,
  Shield,
  type LucideIcon,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  userName: string;
  createdAt: string;
}

const entityIcons: Record<string, LucideIcon> = {
  Appointment: Calendar,
  Payment: CreditCard,
  Service: Scissors,
  StaffMember: UserPlus,
  Business: Settings,
  Notification: Bell,
  BusinessSettings: Settings,
};

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Shield className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">Sin actividad reciente</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((item) => {
        const Icon = entityIcons[item.entity] || Shield;
        return (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2"
          >
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{item.userName}</span>{" "}
                <span className="text-muted-foreground">
                  {formatAction(item.action, item.entity)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatAction(action: string, entity: string): string {
  const entityNames: Record<string, string> = {
    Appointment: "turno",
    Service: "servicio",
    StaffMember: "profesional",
    Business: "negocio",
    BusinessSettings: "configuracion",
    ServiceCategory: "categoria",
    Payment: "pago",
  };

  const actionNames: Record<string, string> = {
    create: "creo",
    update: "actualizo",
    delete: "elimino",
    confirm: "confirmo",
    complete: "completo",
    cancel: "cancelo",
  };

  const parts = action.split(":");
  const verb = actionNames[parts[1]] || parts[1] || action;
  const noun = entityNames[entity] || entity;

  return `${verb} un ${noun}`;
}
