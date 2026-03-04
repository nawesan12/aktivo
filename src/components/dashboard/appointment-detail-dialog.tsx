"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  Scissors,
  CreditCard,
  FileText,
  X,
} from "lucide-react";
import { StatusBadge } from "./status-badge";

interface AppointmentDetail {
  id: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  clientType: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  staffName: string;
  dateTime: string;
  endTime?: string;
  status: string;
  notes?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
}

interface Props {
  appointment: AppointmentDetail | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

export function AppointmentDetailDialog({ appointment, onClose, onStatusChange }: Props) {
  if (!appointment) return null;

  const statusActions: Record<string, { label: string; status: string; className: string }[]> = {
    PENDING: [
      { label: "Confirmar", status: "CONFIRMED", className: "bg-blue-500 hover:bg-blue-600 text-white" },
      { label: "Cancelar", status: "CANCELLED", className: "bg-red-500/10 hover:bg-red-500/20 text-red-500" },
    ],
    PENDING_PAYMENT: [
      { label: "Confirmar", status: "CONFIRMED", className: "bg-blue-500 hover:bg-blue-600 text-white" },
      { label: "Cancelar", status: "CANCELLED", className: "bg-red-500/10 hover:bg-red-500/20 text-red-500" },
    ],
    CONFIRMED: [
      { label: "Completar", status: "COMPLETED", className: "bg-emerald-500 hover:bg-emerald-600 text-white" },
      { label: "No asistio", status: "NO_SHOW", className: "bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-400" },
      { label: "Cancelar", status: "CANCELLED", className: "bg-red-500/10 hover:bg-red-500/20 text-red-500" },
    ],
  };

  const actions = statusActions[appointment.status] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-heading font-semibold text-lg">Detalle del turno</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <StatusBadge status={appointment.status} />
            {appointment.paymentStatus && (
              <span className="text-xs text-muted-foreground">
                Pago: {appointment.paymentStatus === "APPROVED" ? "Aprobado" : appointment.paymentStatus}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Cliente</span>
              </div>
              <p className="text-sm font-medium">{appointment.clientName}</p>
              {appointment.clientPhone && (
                <p className="text-xs text-muted-foreground">{appointment.clientPhone}</p>
              )}
              {appointment.clientEmail && (
                <p className="text-xs text-muted-foreground">{appointment.clientEmail}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Scissors className="w-3.5 h-3.5" />
                <span className="text-xs">Servicio</span>
              </div>
              <p className="text-sm font-medium">{appointment.serviceName}</p>
              <p className="text-xs text-muted-foreground">
                {appointment.serviceDuration} min · ${appointment.servicePrice.toLocaleString("es-AR")}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-xs">Fecha</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(appointment.dateTime), "EEEE d 'de' MMMM", { locale: es })}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">Horario</span>
              </div>
              <p className="text-sm font-medium">
                {format(new Date(appointment.dateTime), "HH:mm", { locale: es })}
                {appointment.endTime && ` - ${format(new Date(appointment.endTime), "HH:mm", { locale: es })}`}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span className="text-xs">Profesional</span>
              </div>
              <p className="text-sm font-medium">{appointment.staffName}</p>
            </div>

            {appointment.paymentAmount && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="text-xs">Pago</span>
                </div>
                <p className="text-sm font-medium">${appointment.paymentAmount.toLocaleString("es-AR")}</p>
              </div>
            )}
          </div>

          {appointment.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="w-3.5 h-3.5" />
                <span className="text-xs">Notas</span>
              </div>
              <p className="text-sm bg-muted/30 rounded-lg p-3">{appointment.notes}</p>
            </div>
          )}

          {actions.length > 0 && (
            <div className="flex gap-2 pt-2 border-t border-border">
              {actions.map((action) => (
                <button
                  key={action.status}
                  onClick={() => onStatusChange(appointment.id, action.status)}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${action.className}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
