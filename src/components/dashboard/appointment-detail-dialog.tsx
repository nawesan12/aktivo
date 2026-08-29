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
} from "lucide-react";
import { StatusBadge } from "./status-badge";
import { formatCurrency } from "@/lib/format";
import { statusStyle } from "@/lib/appointment-status";
import type { AppointmentStatus } from "@/generated/prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

  // Colours come from the shared status map, so the "Completar" button is the
  // same green as the COMPLETED badge it produces.
  const statusActions: Record<string, { label: string; status: AppointmentStatus }[]> = {
    PENDING: [
      { label: "Confirmar", status: "CONFIRMED" },
      { label: "Cancelar", status: "CANCELLED" },
    ],
    PENDING_PAYMENT: [
      { label: "Confirmar", status: "CONFIRMED" },
      { label: "Cancelar", status: "CANCELLED" },
    ],
    CONFIRMED: [
      { label: "Completar", status: "COMPLETED" },
      { label: "No asistió", status: "NO_SHOW" },
      { label: "Cancelar", status: "CANCELLED" },
    ],
  };

  const actions = statusActions[appointment.status] || [];

  return (
    // Dialog brings the focus trap, Escape, and the close button — the
    // hand-rolled overlay had none of them, so a keyboard user could tab out
    // of the dialog and keep operating the table behind it.
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del turno</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
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
                {appointment.serviceDuration} min · {formatCurrency(appointment.servicePrice)}
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
                <p className="text-sm font-medium">{formatCurrency(appointment.paymentAmount)}</p>
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
                  className={`flex-1 h-9 rounded-lg text-sm font-medium transition-colors ${statusStyle(action.status).action}`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
